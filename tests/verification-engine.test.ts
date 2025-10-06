import { describe, it, expect, beforeEach } from "vitest";
import { buffCV, stringAsciiCV, uintCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_PRACTICE_ID = 101;
const ERR_INVALID_VERIFIER = 102;
const ERR_INVALID_PROOF_HASH = 103;
const ERR_INVALID_TIMESTAMP = 104;
const ERR_INVALID_SCORE = 105;
const ERR_PRACTICE_ALREADY_VERIFIED = 106;
const ERR_PRACTICE_NOT_FOUND = 107;
const ERR_VERIFIER_NOT_REGISTERED = 108;
const ERR_INVALID_STATUS = 109;
const ERR_INVALID_REASON = 110;
const ERR_INVALID_VERIFICATION_FEE = 111;
const ERR_MAX_VERIFICATIONS_EXCEEDED = 112;
const ERR_INVALID_UPDATE_PARAM = 113;
const ERR_VERIFICATION_UPDATE_NOT_ALLOWED = 114;
const ERR_INVALID_VERIFIER_RATING = 115;
const ERR_INVALID_PRACTICE_TYPE = 116;
const ERR_INVALID_IMPACT_LEVEL = 117;
const ERR_INVALID_LOCATION = 118;
const ERR_INVALID_EVIDENCE_URL = 119;
const ERR_AUTHORITY_NOT_VERIFIED = 123;
const ERR_INVALID_MIN_SCORE = 124;
const ERR_INVALID_MAX_SCORE = 125;

interface Verification {
  practiceId: number;
  verifier: string;
  proofHash: Buffer;
  timestamp: number;
  score: number;
  status: string;
  reason: string | null;
  practiceType: string;
  impactLevel: number;
  location: string;
  evidenceUrl: string | null;
  farmer: string;
}

interface VerificationUpdate {
  updateScore: number;
  updateStatus: string;
  updateReason: string | null;
  updateTimestamp: number;
  updater: string;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class VerificationEngineMock {
  state: {
    nextVerificationId: number;
    maxVerifications: number;
    verificationFee: number;
    authorityContract: string | null;
    minVerificationScore: number;
    maxVerificationScore: number;
    reviewPeriod: number;
    challengePeriod: number;
    verifications: Map<number, Verification>;
    verificationUpdates: Map<number, VerificationUpdate>;
    verifierRatings: Map<string, number>;
  } = {
    nextVerificationId: 0,
    maxVerifications: 10000,
    verificationFee: 500,
    authorityContract: null,
    minVerificationScore: 50,
    maxVerificationScore: 100,
    reviewPeriod: 144,
    challengePeriod: 288,
    verifications: new Map(),
    verificationUpdates: new Map(),
    verifierRatings: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1VERIFIER";
  stxTransfers: Array<{ amount: number; from: string; to: string | null }> = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      nextVerificationId: 0,
      maxVerifications: 10000,
      verificationFee: 500,
      authorityContract: null,
      minVerificationScore: 50,
      maxVerificationScore: 100,
      reviewPeriod: 144,
      challengePeriod: 288,
      verifications: new Map(),
      verificationUpdates: new Map(),
      verifierRatings: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1VERIFIER";
    this.stxTransfers = [];
  }

  setAuthorityContract(contractPrincipal: string): Result<boolean> {
    if (contractPrincipal === "SP000000000000000000002Q6VF78") {
      return { ok: false, value: false };
    }
    if (this.state.authorityContract !== null) {
      return { ok: false, value: false };
    }
    this.state.authorityContract = contractPrincipal;
    return { ok: true, value: true };
  }

  setVerificationFee(newFee: number): Result<boolean> {
    if (newFee < 0) return { ok: false, value: ERR_INVALID_VERIFICATION_FEE };
    if (!this.state.authorityContract) return { ok: false, value: ERR_AUTHORITY_NOT_VERIFIED };
    this.state.verificationFee = newFee;
    return { ok: true, value: true };
  }

  setMinVerificationScore(newMin: number): Result<boolean> {
    if (newMin <= 0 || newMin >= this.state.maxVerificationScore) return { ok: false, value: ERR_INVALID_MIN_SCORE };
    if (!this.state.authorityContract) return { ok: false, value: ERR_AUTHORITY_NOT_VERIFIED };
    this.state.minVerificationScore = newMin;
    return { ok: true, value: true };
  }

  setMaxVerificationScore(newMax: number): Result<boolean> {
    if (newMax <= this.state.minVerificationScore || newMax > 100) return { ok: false, value: ERR_INVALID_MAX_SCORE };
    if (!this.state.authorityContract) return { ok: false, value: ERR_AUTHORITY_NOT_VERIFIED };
    this.state.maxVerificationScore = newMax;
    return { ok: true, value: true };
  }

  requestVerification(
    practiceId: number,
    proofHash: Buffer,
    practiceType: string,
    impactLevel: number,
    location: string,
    evidenceUrl: string | null,
    farmer: string
  ): Result<number> {
    if (this.state.nextVerificationId >= this.state.maxVerifications) return { ok: false, value: ERR_MAX_VERIFICATIONS_EXCEEDED };
    if (practiceId <= 0) return { ok: false, value: ERR_INVALID_PRACTICE_ID };
    if (proofHash.length !== 32) return { ok: false, value: ERR_INVALID_PROOF_HASH };
    if (!["soil", "agroforestry", "biodiversity"].includes(practiceType)) return { ok: false, value: ERR_INVALID_PRACTICE_TYPE };
    if (impactLevel <= 0 || impactLevel > 10) return { ok: false, value: ERR_INVALID_IMPACT_LEVEL };
    if (!location || location.length > 100) return { ok: false, value: ERR_INVALID_LOCATION };
    if (evidenceUrl && evidenceUrl.length > 256) return { ok: false, value: ERR_INVALID_EVIDENCE_URL };
    if (!this.state.authorityContract) return { ok: false, value: ERR_AUTHORITY_NOT_VERIFIED };
    this.stxTransfers.push({ amount: this.state.verificationFee, from: this.caller, to: this.state.authorityContract });
    const id = this.state.nextVerificationId;
    const verification: Verification = {
      practiceId,
      verifier: this.caller,
      proofHash,
      timestamp: this.blockHeight,
      score: 0,
      status: "pending",
      reason: null,
      practiceType,
      impactLevel,
      location,
      evidenceUrl,
      farmer,
    };
    this.state.verifications.set(id, verification);
    this.state.nextVerificationId++;
    return { ok: true, value: id };
  }

  approvePractice(
    verificationId: number,
    score: number,
    reason: string | null
  ): Result<boolean> {
    const verification = this.state.verifications.get(verificationId);
    if (!verification) return { ok: false, value: ERR_PRACTICE_NOT_FOUND };
    if (verification.verifier !== this.caller) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (verification.status !== "pending") return { ok: false, value: ERR_PRACTICE_ALREADY_VERIFIED };
    if (score < this.state.minVerificationScore || score > this.state.maxVerificationScore) return { ok: false, value: ERR_INVALID_SCORE };
    if (reason && reason.length > 256) return { ok: false, value: ERR_INVALID_REASON };
    const updated: Verification = {
      ...verification,
      score,
      status: "approved",
      reason,
      timestamp: this.blockHeight,
    };
    this.state.verifications.set(verificationId, updated);
    const currentRating = this.state.verifierRatings.get(this.caller) || 0;
    this.state.verifierRatings.set(this.caller, currentRating + 1);
    return { ok: true, value: true };
  }

  rejectPractice(
    verificationId: number,
    reason: string
  ): Result<boolean> {
    const verification = this.state.verifications.get(verificationId);
    if (!verification) return { ok: false, value: ERR_PRACTICE_NOT_FOUND };
    if (verification.verifier !== this.caller) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (verification.status !== "pending") return { ok: false, value: ERR_PRACTICE_ALREADY_VERIFIED };
    if (reason.length > 256) return { ok: false, value: ERR_INVALID_REASON };
    const updated: Verification = {
      ...verification,
      score: 0,
      status: "rejected",
      reason,
      timestamp: this.blockHeight,
    };
    this.state.verifications.set(verificationId, updated);
    const currentRating = this.state.verifierRatings.get(this.caller) || 0;
    if (currentRating > 0) {
      this.state.verifierRatings.set(this.caller, currentRating - 1);
    }
    return { ok: true, value: true };
  }

  updateVerification(
    verificationId: number,
    updateScore: number,
    updateReason: string | null
  ): Result<boolean> {
    const verification = this.state.verifications.get(verificationId);
    if (!verification) return { ok: false, value: ERR_PRACTICE_NOT_FOUND };
    if (verification.verifier !== this.caller) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (verification.status === "pending") return { ok: false, value: ERR_VERIFICATION_UPDATE_NOT_ALLOWED };
    if (updateScore < this.state.minVerificationScore || updateScore > this.state.maxVerificationScore) return { ok: false, value: ERR_INVALID_SCORE };
    if (updateReason && updateReason.length > 256) return { ok: false, value: ERR_INVALID_REASON };
    const updated: Verification = {
      ...verification,
      score: updateScore,
      reason: updateReason,
      timestamp: this.blockHeight,
    };
    this.state.verifications.set(verificationId, updated);
    this.state.verificationUpdates.set(verificationId, {
      updateScore,
      updateStatus: verification.status,
      updateReason,
      updateTimestamp: this.blockHeight,
      updater: this.caller,
    });
    return { ok: true, value: true };
  }

  getVerificationCount(): Result<number> {
    return { ok: true, value: this.state.nextVerificationId };
  }

  getVerification(id: number): Verification | undefined {
    return this.state.verifications.get(id);
  }

  getVerifierRating(verifier: string): number {
    return this.state.verifierRatings.get(verifier) || 0;
  }
}

describe("VerificationEngine", () => {
  let contract: VerificationEngineMock;

  beforeEach(() => {
    contract = new VerificationEngineMock();
    contract.reset();
  });

  it("sets authority contract successfully", () => {
    const result = contract.setAuthorityContract("ST2AUTH");
    expect(result.ok).toBe(true);
    expect(contract.state.authorityContract).toBe("ST2AUTH");
  });

  it("rejects invalid authority contract", () => {
    const result = contract.setAuthorityContract("SP000000000000000000002Q6VF78");
    expect(result.ok).toBe(false);
  });

  it("sets verification fee successfully", () => {
    contract.setAuthorityContract("ST2AUTH");
    const result = contract.setVerificationFee(1000);
    expect(result.ok).toBe(true);
    expect(contract.state.verificationFee).toBe(1000);
  });

  it("rejects verification fee change without authority", () => {
    const result = contract.setVerificationFee(1000);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_AUTHORITY_NOT_VERIFIED);
  });

  it("sets min verification score successfully", () => {
    contract.setAuthorityContract("ST2AUTH");
    const result = contract.setMinVerificationScore(60);
    expect(result.ok).toBe(true);
    expect(contract.state.minVerificationScore).toBe(60);
  });

  it("rejects invalid min score", () => {
    contract.setAuthorityContract("ST2AUTH");
    const result = contract.setMinVerificationScore(101);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_MIN_SCORE);
  });

  it("sets max verification score successfully", () => {
    contract.setAuthorityContract("ST2AUTH");
    const result = contract.setMaxVerificationScore(95);
    expect(result.ok).toBe(true);
    expect(contract.state.maxVerificationScore).toBe(95);
  });

  it("rejects invalid max score", () => {
    contract.setAuthorityContract("ST2AUTH");
    const result = contract.setMaxVerificationScore(40);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_MAX_SCORE);
  });

  it("requests verification successfully", () => {
    contract.setAuthorityContract("ST2AUTH");
    const proofHash = Buffer.alloc(32);
    const result = contract.requestVerification(
      1,
      proofHash,
      "soil",
      5,
      "Farm Location",
      "https://evidence.com",
      "ST3FARMER"
    );
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);
    const verification = contract.getVerification(0);
    expect(verification?.practiceId).toBe(1);
    expect(verification?.practiceType).toBe("soil");
    expect(verification?.status).toBe("pending");
    expect(contract.stxTransfers).toEqual([{ amount: 500, from: "ST1VERIFIER", to: "ST2AUTH" }]);
  });

  it("rejects request without authority", () => {
    const proofHash = Buffer.alloc(32);
    const result = contract.requestVerification(
      1,
      proofHash,
      "soil",
      5,
      "Farm Location",
      "https://evidence.com",
      "ST3FARMER"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_AUTHORITY_NOT_VERIFIED);
  });

  it("rejects invalid practice id", () => {
    contract.setAuthorityContract("ST2AUTH");
    const proofHash = Buffer.alloc(32);
    const result = contract.requestVerification(
      0,
      proofHash,
      "soil",
      5,
      "Farm Location",
      "https://evidence.com",
      "ST3FARMER"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_PRACTICE_ID);
  });

  it("rejects invalid proof hash", () => {
    contract.setAuthorityContract("ST2AUTH");
    const proofHash = Buffer.alloc(31);
    const result = contract.requestVerification(
      1,
      proofHash,
      "soil",
      5,
      "Farm Location",
      "https://evidence.com",
      "ST3FARMER"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_PROOF_HASH);
  });

  it("rejects invalid practice type", () => {
    contract.setAuthorityContract("ST2AUTH");
    const proofHash = Buffer.alloc(32);
    const result = contract.requestVerification(
      1,
      proofHash,
      "invalid",
      5,
      "Farm Location",
      "https://evidence.com",
      "ST3FARMER"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_PRACTICE_TYPE);
  });

  it("approves practice successfully", () => {
    contract.setAuthorityContract("ST2AUTH");
    const proofHash = Buffer.alloc(32);
    contract.requestVerification(
      1,
      proofHash,
      "soil",
      5,
      "Farm Location",
      "https://evidence.com",
      "ST3FARMER"
    );
    const result = contract.approvePractice(0, 80, "Good practice");
    expect(result.ok).toBe(true);
    const verification = contract.getVerification(0);
    expect(verification?.status).toBe("approved");
    expect(verification?.score).toBe(80);
    expect(verification?.reason).toBe("Good practice");
    expect(contract.getVerifierRating("ST1VERIFIER")).toBe(1);
  });

  it("rejects approve for non-existent verification", () => {
    const result = contract.approvePractice(99, 80, "Good practice");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_PRACTICE_NOT_FOUND);
  });

  it("rejects approve by non-verifier", () => {
    contract.setAuthorityContract("ST2AUTH");
    const proofHash = Buffer.alloc(32);
    contract.requestVerification(
      1,
      proofHash,
      "soil",
      5,
      "Farm Location",
      "https://evidence.com",
      "ST3FARMER"
    );
    contract.caller = "ST4OTHER";
    const result = contract.approvePractice(0, 80, "Good practice");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("rejects approve for already verified", () => {
    contract.setAuthorityContract("ST2AUTH");
    const proofHash = Buffer.alloc(32);
    contract.requestVerification(
      1,
      proofHash,
      "soil",
      5,
      "Farm Location",
      "https://evidence.com",
      "ST3FARMER"
    );
    contract.approvePractice(0, 80, "Good practice");
    const result = contract.approvePractice(0, 90, "Updated");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_PRACTICE_ALREADY_VERIFIED);
  });

  it("rejects invalid score for approve", () => {
    contract.setAuthorityContract("ST2AUTH");
    const proofHash = Buffer.alloc(32);
    contract.requestVerification(
      1,
      proofHash,
      "soil",
      5,
      "Farm Location",
      "https://evidence.com",
      "ST3FARMER"
    );
    const result = contract.approvePractice(0, 40, "Low score");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_SCORE);
  });

  it("rejects practice successfully", () => {
    contract.setAuthorityContract("ST2AUTH");
    const proofHash = Buffer.alloc(32);
    contract.requestVerification(
      1,
      proofHash,
      "soil",
      5,
      "Farm Location",
      "https://evidence.com",
      "ST3FARMER"
    );
    const result = contract.rejectPractice(0, "Insufficient evidence");
    expect(result.ok).toBe(true);
    const verification = contract.getVerification(0);
    expect(verification?.status).toBe("rejected");
    expect(verification?.score).toBe(0);
    expect(verification?.reason).toBe("Insufficient evidence");
    expect(contract.getVerifierRating("ST1VERIFIER")).toBe(0);
  });

  it("decreases rating on reject if positive", () => {
    contract.setAuthorityContract("ST2AUTH");
    const proofHash = Buffer.alloc(32);
    contract.requestVerification(
      1,
      proofHash,
      "soil",
      5,
      "Farm Location",
      "https://evidence.com",
      "ST3FARMER"
    );
    contract.approvePractice(0, 80, "Good");
    expect(contract.getVerifierRating("ST1VERIFIER")).toBe(1);
    contract.requestVerification(
      2,
      proofHash,
      "agroforestry",
      6,
      "Another Farm",
      null,
      "ST3FARMER"
    );
    contract.rejectPractice(1, "Bad evidence");
    expect(contract.getVerifierRating("ST1VERIFIER")).toBe(0);
  });

  it("updates verification successfully", () => {
    contract.setAuthorityContract("ST2AUTH");
    const proofHash = Buffer.alloc(32);
    contract.requestVerification(
      1,
      proofHash,
      "soil",
      5,
      "Farm Location",
      "https://evidence.com",
      "ST3FARMER"
    );
    contract.approvePractice(0, 80, "Initial");
    const result = contract.updateVerification(0, 85, "Updated reason");
    expect(result.ok).toBe(true);
    const verification = contract.getVerification(0);
    expect(verification?.score).toBe(85);
    expect(verification?.reason).toBe("Updated reason");
    const update = contract.state.verificationUpdates.get(0);
    expect(update?.updateScore).toBe(85);
    expect(update?.updateReason).toBe("Updated reason");
  });

  it("rejects update for pending verification", () => {
    contract.setAuthorityContract("ST2AUTH");
    const proofHash = Buffer.alloc(32);
    contract.requestVerification(
      1,
      proofHash,
      "soil",
      5,
      "Farm Location",
      "https://evidence.com",
      "ST3FARMER"
    );
    const result = contract.updateVerification(0, 85, "Updated");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_VERIFICATION_UPDATE_NOT_ALLOWED);
  });

  it("rejects update by non-verifier", () => {
    contract.setAuthorityContract("ST2AUTH");
    const proofHash = Buffer.alloc(32);
    contract.requestVerification(
      1,
      proofHash,
      "soil",
      5,
      "Farm Location",
      "https://evidence.com",
      "ST3FARMER"
    );
    contract.approvePractice(0, 80, "Good");
    contract.caller = "ST4OTHER";
    const result = contract.updateVerification(0, 85, "Updated");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("gets verification count correctly", () => {
    contract.setAuthorityContract("ST2AUTH");
    const proofHash = Buffer.alloc(32);
    contract.requestVerification(
      1,
      proofHash,
      "soil",
      5,
      "Farm Location",
      "https://evidence.com",
      "ST3FARMER"
    );
    contract.requestVerification(
      2,
      proofHash,
      "agroforestry",
      6,
      "Another Farm",
      null,
      "ST3FARMER"
    );
    const result = contract.getVerificationCount();
    expect(result.ok).toBe(true);
    expect(result.value).toBe(2);
  });

  it("rejects max verifications exceeded", () => {
    contract.setAuthorityContract("ST2AUTH");
    contract.state.maxVerifications = 1;
    const proofHash = Buffer.alloc(32);
    contract.requestVerification(
      1,
      proofHash,
      "soil",
      5,
      "Farm Location",
      "https://evidence.com",
      "ST3FARMER"
    );
    const result = contract.requestVerification(
      2,
      proofHash,
      "agroforestry",
      6,
      "Another Farm",
      null,
      "ST3FARMER"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_MAX_VERIFICATIONS_EXCEEDED);
  });

  it("rejects invalid location", () => {
    contract.setAuthorityContract("ST2AUTH");
    const proofHash = Buffer.alloc(32);
    const longLocation = "A".repeat(101);
    const result = contract.requestVerification(
      1,
      proofHash,
      "soil",
      5,
      longLocation,
      "https://evidence.com",
      "ST3FARMER"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_LOCATION);
  });

  it("rejects invalid evidence url", () => {
    contract.setAuthorityContract("ST2AUTH");
    const proofHash = Buffer.alloc(32);
    const longUrl = "https://" + "a".repeat(250) + ".com";
    const result = contract.requestVerification(
      1,
      proofHash,
      "soil",
      5,
      "Farm Location",
      longUrl,
      "ST3FARMER"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_EVIDENCE_URL);
  });

  it("rejects invalid reason length in approve", () => {
    contract.setAuthorityContract("ST2AUTH");
    const proofHash = Buffer.alloc(32);
    contract.requestVerification(
      1,
      proofHash,
      "soil",
      5,
      "Farm Location",
      "https://evidence.com",
      "ST3FARMER"
    );
    const longReason = "R".repeat(257);
    const result = contract.approvePractice(0, 80, longReason);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_REASON);
  });

  it("rejects invalid reason length in reject", () => {
    contract.setAuthorityContract("ST2AUTH");
    const proofHash = Buffer.alloc(32);
    contract.requestVerification(
      1,
      proofHash,
      "soil",
      5,
      "Farm Location",
      "https://evidence.com",
      "ST3FARMER"
    );
    const longReason = "R".repeat(257);
    const result = contract.rejectPractice(0, longReason);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_REASON);
  });
});
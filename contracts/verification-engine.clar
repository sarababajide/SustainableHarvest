(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-PRACTICE-ID u101)
(define-constant ERR-INVALID-VERIFIER u102)
(define-constant ERR-INVALID-PROOF-HASH u103)
(define-constant ERR-INVALID-TIMESTAMP u104)
(define-constant ERR-INVALID-SCORE u105)
(define-constant ERR-PRACTICE-ALREADY-VERIFIED u106)
(define-constant ERR-PRACTICE-NOT-FOUND u107)
(define-constant ERR-VERIFIER-NOT-REGISTERED u108)
(define-constant ERR-INVALID-STATUS u109)
(define-constant ERR-INVALID-REASON u110)
(define-constant ERR-INVALID-VERIFICATION-FEE u111)
(define-constant ERR-MAX-VERIFICATIONS-EXCEEDED u112)
(define-constant ERR-INVALID-UPDATE-PARAM u113)
(define-constant ERR-VERIFICATION-UPDATE-NOT-ALLOWED u114)
(define-constant ERR-INVALID-VERIFIER-RATING u115)
(define-constant ERR-INVALID-PRACTICE-TYPE u116)
(define-constant ERR-INVALID-IMPACT-LEVEL u117)
(define-constant ERR-INVALID-LOCATION u118)
(define-constant ERR-INVALID-EVIDENCE-URL u119)
(define-constant ERR-INVALID-REVIEW-PERIOD u120)
(define-constant ERR-INVALID-CHALLENGE-PERIOD u121)
(define-constant ERR-INVALID-REWARD-POOL u122)
(define-constant ERR-AUTHORITY-NOT-VERIFIED u123)
(define-constant ERR-INVALID-MIN-SCORE u124)
(define-constant ERR-INVALID-MAX-SCORE u125)

(define-data-var next-verification-id uint u0)
(define-data-var max-verifications uint u10000)
(define-data-var verification-fee uint u500)
(define-data-var authority-contract (optional principal) none)
(define-data-var min-verification-score uint u50)
(define-data-var max-verification-score uint u100)
(define-data-var review-period uint u144)
(define-data-var challenge-period uint u288)

(define-map verifications
  uint
  {
    practice-id: uint,
    verifier: principal,
    proof-hash: (buff 32),
    timestamp: uint,
    score: uint,
    status: (string-ascii 20),
    reason: (optional (string-utf8 256)),
    practice-type: (string-ascii 50),
    impact-level: uint,
    location: (string-utf8 100),
    evidence-url: (optional (string-ascii 256)),
    farmer: principal
  }
)

(define-map verification-updates
  uint
  {
    update-score: uint,
    update-status: (string-ascii 20),
    update-reason: (optional (string-utf8 256)),
    update-timestamp: uint,
    updater: principal
  }
)

(define-map verifier-ratings
  principal
  uint
)

(define-read-only (get-verification (id uint))
  (map-get? verifications id)
)

(define-read-only (get-verification-update (id uint))
  (map-get? verification-updates id)
)

(define-read-only (get-verifier-rating (verifier principal))
  (default-to u0 (map-get? verifier-ratings verifier))
)

(define-private (validate-practice-id (id uint))
  (if (> id u0)
      (ok true)
      (err ERR-INVALID-PRACTICE-ID))
)

(define-private (validate-verifier (v principal))
  (if (not (is-eq v tx-sender))
      (ok true)
      (err ERR-INVALID-VERIFIER))
)

(define-private (validate-proof-hash (hash (buff 32)))
  (if (is-eq (len hash) u32)
      (ok true)
      (err ERR-INVALID-PROOF-HASH))
)

(define-private (validate-timestamp (ts uint))
  (if (>= ts block-height)
      (ok true)
      (err ERR-INVALID-TIMESTAMP))
)

(define-private (validate-score (s uint))
  (if (and (>= s (var-get min-verification-score)) (<= s (var-get max-verification-score)))
      (ok true)
      (err ERR-INVALID-SCORE))
)

(define-private (validate-status (st (string-ascii 20)))
  (if (or (is-eq st "pending") (is-eq st "approved") (is-eq st "rejected"))
      (ok true)
      (err ERR-INVALID-STATUS))
)

(define-private (validate-reason (r (optional (string-utf8 256))))
  (match r reason
    (if (<= (len reason) u256)
        (ok true)
        (err ERR-INVALID-REASON))
    (ok true))
)

(define-private (validate-practice-type (pt (string-ascii 50)))
  (if (or (is-eq pt "soil") (is-eq pt "agroforestry") (is-eq pt "biodiversity"))
      (ok true)
      (err ERR-INVALID-PRACTICE-TYPE))
)

(define-private (validate-impact-level (il uint))
  (if (and (> il u0) (<= il u10))
      (ok true)
      (err ERR-INVALID-IMPACT-LEVEL))
)

(define-private (validate-location (loc (string-utf8 100)))
  (if (and (> (len loc) u0) (<= (len loc) u100))
      (ok true)
      (err ERR-INVALID-LOCATION))
)

(define-private (validate-evidence-url (url (optional (string-ascii 256))))
  (match url u
    (if (<= (len u) u256)
        (ok true)
        (err ERR-INVALID-EVIDENCE-URL))
    (ok true))
)

(define-private (validate-principal (p principal))
  (if (not (is-eq p 'SP000000000000000000002Q6VF78))
      (ok true)
      (err ERR-NOT-AUTHORIZED))
)

(define-public (set-authority-contract (contract-principal principal))
  (begin
    (try! (validate-principal contract-principal))
    (asserts! (is-none (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set authority-contract (some contract-principal))
    (ok true)
  )
)

(define-public (set-verification-fee (new-fee uint))
  (begin
    (asserts! (>= new-fee u0) (err ERR-INVALID-VERIFICATION-FEE))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set verification-fee new-fee)
    (ok true)
  )
)

(define-public (set-min-verification-score (new-min uint))
  (begin
    (asserts! (and (> new-min u0) (< new-min (var-get max-verification-score))) (err ERR-INVALID-MIN-SCORE))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set min-verification-score new-min)
    (ok true)
  )
)

(define-public (set-max-verification-score (new-max uint))
  (begin
    (asserts! (and (> new-max (var-get min-verification-score)) (<= new-max u100)) (err ERR-INVALID-MAX-SCORE))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set max-verification-score new-max)
    (ok true)
  )
)

(define-public (request-verification
  (practice-id uint)
  (proof-hash (buff 32))
  (practice-type (string-ascii 50))
  (impact-level uint)
  (location (string-utf8 100))
  (evidence-url (optional (string-ascii 256)))
  (farmer principal)
)
  (let (
        (next-id (var-get next-verification-id))
        (current-max (var-get max-verifications))
        (authority (var-get authority-contract))
      )
    (asserts! (< next-id current-max) (err ERR-MAX-VERIFICATIONS-EXCEEDED))
    (try! (validate-practice-id practice-id))
    (try! (validate-proof-hash proof-hash))
    (try! (validate-practice-type practice-type))
    (try! (validate-impact-level impact-level))
    (try! (validate-location location))
    (try! (validate-evidence-url evidence-url))
    (let ((authority-recipient (unwrap! authority (err ERR-AUTHORITY-NOT-VERIFIED))))
      (try! (stx-transfer? (var-get verification-fee) tx-sender authority-recipient))
    )
    (map-set verifications next-id
      {
        practice-id: practice-id,
        verifier: tx-sender,
        proof-hash: proof-hash,
        timestamp: block-height,
        score: u0,
        status: "pending",
        reason: none,
        practice-type: practice-type,
        impact-level: impact-level,
        location: location,
        evidence-url: evidence-url,
        farmer: farmer
      }
    )
    (var-set next-verification-id (+ next-id u1))
    (print { event: "verification-requested", id: next-id })
    (ok next-id)
  )
)

(define-public (approve-practice
  (verification-id uint)
  (score uint)
  (reason (optional (string-utf8 256)))
)
  (let ((verification (map-get? verifications verification-id)))
    (match verification
      v
        (begin
          (asserts! (is-eq (get verifier v) tx-sender) (err ERR-NOT-AUTHORIZED))
          (asserts! (is-eq (get status v) "pending") (err ERR-PRACTICE-ALREADY-VERIFIED))
          (try! (validate-score score))
          (try! (validate-reason reason))
          (map-set verifications verification-id
            (merge v {
              score: score,
              status: "approved",
              reason: reason,
              timestamp: block-height
            })
          )
          (let ((current-rating (get-verifier-rating tx-sender)))
            (map-set verifier-ratings tx-sender (+ current-rating u1))
          )
          (print { event: "practice-approved", id: verification-id })
          (ok true)
        )
      (err ERR-PRACTICE-NOT-FOUND)
    )
  )
)

(define-public (reject-practice
  (verification-id uint)
  (reason (string-utf8 256))
)
  (let ((verification (map-get? verifications verification-id)))
    (match verification
      v
        (begin
          (asserts! (is-eq (get verifier v) tx-sender) (err ERR-NOT-AUTHORIZED))
          (asserts! (is-eq (get status v) "pending") (err ERR-PRACTICE-ALREADY-VERIFIED))
          (try! (validate-reason (some reason)))
          (map-set verifications verification-id
            (merge v {
              score: u0,
              status: "rejected",
              reason: (some reason),
              timestamp: block-height
            })
          )
          (let ((current-rating (get-verifier-rating tx-sender)))
            (if (> current-rating u0)
                (map-set verifier-ratings tx-sender (- current-rating u1))
                (ok true)
            )
          )
          (print { event: "practice-rejected", id: verification-id })
          (ok true)
        )
      (err ERR-PRACTICE-NOT-FOUND)
    )
  )
)

(define-public (update-verification
  (verification-id uint)
  (update-score uint)
  (update-reason (optional (string-utf8 256)))
)
  (let ((verification (map-get? verifications verification-id)))
    (match verification
      v
        (begin
          (asserts! (is-eq (get verifier v) tx-sender) (err ERR-NOT-AUTHORIZED))
          (asserts! (not (is-eq (get status v) "pending")) (err ERR-VERIFICATION-UPDATE-NOT-ALLOWED))
          (try! (validate-score update-score))
          (try! (validate-reason update-reason))
          (map-set verifications verification-id
            (merge v {
              score: update-score,
              reason: update-reason,
              timestamp: block-height
            })
          )
          (map-set verification-updates verification-id
            {
              update-score: update-score,
              update-status: (get status v),
              update-reason: update-reason,
              update-timestamp: block-height,
              updater: tx-sender
            }
          )
          (print { event: "verification-updated", id: verification-id })
          (ok true)
        )
      (err ERR-PRACTICE-NOT-FOUND)
    )
  )
)

(define-public (get-verification-count)
  (ok (var-get next-verification-id))
)
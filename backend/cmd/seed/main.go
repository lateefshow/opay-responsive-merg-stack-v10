// cmd/seed/main.go — OPay v5 database seeder
// Run: go run ./cmd/seed
package main

import (
	"context"

	"go.mongodb.org/mongo-driver/mongo"
	"fmt"
	"log"
	"math"
	"math/rand"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"github.com/opay/backend/config"
	"github.com/opay/backend/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
)

// ─── helpers ──────────────────────────────────────────────────────────────────

func must(err error) {
	if err != nil {
		log.Fatalf("seed error: %v", err)
	}
}

func ago(d time.Duration) time.Time  { return time.Now().Add(-d) }
func from(d time.Duration) time.Time { return time.Now().Add(d) }
func daysAgo(n int) time.Time        { return ago(time.Duration(n) * 24 * time.Hour) }
func daysFrom(n int) time.Time       { return from(time.Duration(n) * 24 * time.Hour) }

func hashPwd(plain string) string {
	h, err := bcrypt.GenerateFromPassword([]byte(plain), 10)
	must(err)
	return string(h)
}

func ref(prefix string) string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	b := make([]byte, 8)
	for i := range b {
		b[i] = chars[rand.Intn(len(chars))]
	}
	return prefix + "-" + string(b)
}

func round2(v float64) float64 { return math.Round(v*100) / 100 }

// ─── main ─────────────────────────────────────────────────────────────────────

func main() {
	rand.Seed(time.Now().UnixNano())
	_ = godotenv.Load()
	config.Load()
	config.ConnectDB()
	defer config.DisconnectDB()

	ctx := context.Background()
	db := config.DB

	fmt.Println("🗑  Clearing existing collections…")
	collections := []string{
		"users", "wallets", "transactions", "cards",
		"investments", "loans", "referrals", "token_blacklist",
		"exchange_transactions", "insurances",
		"savings_plans", "scheduled_payments", "notifications",
		"budgets", "cashback_offers", "cashback_earned",
		"credit_scores", "subscriptions", "remittance_recipients", "remittance_transactions",
		"splits", "gift_cards",
		"net_worth_snapshots", "bnpl_plans", "merchant_profiles", "merchant_transactions",
		"bank_accounts", "wire_transfers", "tax_years", "tax_documents",
		"social_activities", "escrow_contracts", "payment_links", "portfolio_holdings",
		"family_accounts", "payment_link_payments",
		"airtime_purchases", "bill_payments", "alert_rules", "crypto_wallets", "crypto_transactions",
		"user_challenges", "travel_bookings",
		"login_devices", "login_history", "security_alerts", "pension_plans",
		"contacts", "support_tickets",
	}
	for _, col := range collections {
		_, _ = db.Collection(col).DeleteMany(ctx, bson.M{})
	}
	fmt.Println("   Done.")

	// ═══════════════════════════════════════════════════════════════
	// 1. USERS
	// ═══════════════════════════════════════════════════════════════
	fmt.Println("👤  Seeding users…")

	pwdHash := hashPwd("Password@123")

	type userSeed struct {
		id           primitive.ObjectID
		firstName    string
		lastName     string
		email        string
		phone        string
		referralCode string
		referredBy   string
		isVerified   bool
		kycLevel     int
		createdAt    time.Time
	}

	userDefs := []userSeed{
		{primitive.NewObjectID(), "Adaeze",    "Okonkwo",  "adaeze@opay.ng",    "08012345678", "ADAEZE01", "",        true,  3, daysAgo(120)},
		{primitive.NewObjectID(), "Chukwuemeka","Nwosu",   "emeka@opay.ng",     "08023456789", "EMEKA002", "ADAEZE01",true,  2, daysAgo(90) },
		{primitive.NewObjectID(), "Fatimah",   "Abdullahi","fatimah@opay.ng",   "08034567890", "FATIM003", "ADAEZE01",true,  2, daysAgo(75) },
		{primitive.NewObjectID(), "Oluwaseun", "Adeyemi",  "seun@opay.ng",      "08045678901", "SEUN0004", "",        true,  1, daysAgo(60) },
		{primitive.NewObjectID(), "Ngozi",     "Eze",      "ngozi@opay.ng",     "08056789012", "NGOZI005", "EMEKA002",false, 1, daysAgo(45) },
		{primitive.NewObjectID(), "Babatunde", "Fashola",  "tunde@opay.ng",     "08067890123", "TUNDE006", "FATIM003",true,  3, daysAgo(30) },
		{primitive.NewObjectID(), "Amara",     "Osei",     "amara@opay.ng",     "08078901234", "AMARA007", "",        true,  2, daysAgo(15) },
	}

	userIDs := make(map[string]primitive.ObjectID)

	for _, u := range userDefs {
		user := models.User{
			ID:           u.id,
			FirstName:    u.firstName,
			LastName:     u.lastName,
			Email:        u.email,
			Phone:        u.phone,
			PasswordHash: pwdHash,
			ReferralCode: u.referralCode,
			ReferredBy:   u.referredBy,
			IsVerified:   u.isVerified,
			IsActive:     true,
			CreatedAt:    u.createdAt,
			UpdatedAt:    u.createdAt,
		}
		_, err := db.Collection("users").InsertOne(ctx, user)
		must(err)
		userIDs[u.email] = u.id
	}
	fmt.Printf("   ✅  %d users inserted\n\n", len(userDefs))

	// Short-hand aliases
	adaezeID  := userIDs["adaeze@opay.ng"]
	emekaID   := userIDs["emeka@opay.ng"]
	fatimahID := userIDs["fatimah@opay.ng"]
	seunID    := userIDs["seun@opay.ng"]
	ngoziID   := userIDs["ngozi@opay.ng"]
	tundeID   := userIDs["tunde@opay.ng"]
	amaraID   := userIDs["amara@opay.ng"]

	// ═══════════════════════════════════════════════════════════════
	// 2. WALLETS  (seeded with realistic balances)
	// ═══════════════════════════════════════════════════════════════
	fmt.Println("💼  Seeding wallets…")

	type walletSeed struct {
		userID  primitive.ObjectID
		balance float64
	}
	walletDefs := []walletSeed{
		{adaezeID,  485320.50},
		{emekaID,   127800.00},
		{fatimahID, 312450.75},
		{seunID,    58000.00},
		{ngoziID,   15200.00},
		{tundeID,   923100.25},
		{amaraID,   67500.00},
	}

	walletBalances := make(map[primitive.ObjectID]float64)
	for _, w := range walletDefs {
		wallet := models.Wallet{
			ID:        primitive.NewObjectID(),
			UserID:    w.userID,
			Balance:   w.balance,
			Currency:  "NGN",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		_, err := db.Collection("wallets").InsertOne(ctx, wallet)
		must(err)
		walletBalances[w.userID] = w.balance
	}
	fmt.Printf("   ✅  %d wallets inserted\n\n", len(walletDefs))

	// ═══════════════════════════════════════════════════════════════
	// 3. TRANSACTIONS  (20 linked, realistic, cross-user)
	// ═══════════════════════════════════════════════════════════════
	fmt.Println("💳  Seeding transactions…")

	type txSeed struct {
		userID          primitive.ObjectID
		txType          models.TransactionType
		amount          float64
		fee             float64
		balanceBefore   float64
		balanceAfter    float64
		status          models.TransactionStatus
		description     string
		counterpartyName string
		counterpartyID  string
		createdAt       time.Time
	}

	txs := []txSeed{
		// Adaeze funds wallet
		{adaezeID, models.TxFund, 200000, 0, 285320.50, 485320.50, models.TxStatusSuccess, "Wallet top-up via bank transfer", "", "", daysAgo(85)},
		// Adaeze sends to Emeka
		{adaezeID, models.TxTransfer, -50000, 0, 485320.50, 435320.50, models.TxStatusSuccess, "Transfer to Chukwuemeka Nwosu", "Chukwuemeka Nwosu", emekaID.Hex(), daysAgo(80)},
		// Emeka receives from Adaeze
		{emekaID, models.TxReceive, 50000, 0, 77800.00, 127800.00, models.TxStatusSuccess, "Transfer from Adaeze Okonkwo", "Adaeze Okonkwo", adaezeID.Hex(), daysAgo(80)},
		// Fatimah funds wallet
		{fatimahID, models.TxFund, 100000, 0, 212450.75, 312450.75, models.TxStatusSuccess, "Wallet funding via Paystack", "", "", daysAgo(70)},
		// Tunde funds wallet (big)
		{tundeID, models.TxFund, 500000, 0, 423100.25, 923100.25, models.TxStatusSuccess, "Wallet top-up — business account", "", "", daysAgo(25)},
		// Adaeze pays airtime bill
		{adaezeID, models.TxTransfer, -3500, 50, 435320.50, 431770.50, models.TxStatusSuccess, "MTN airtime — 08012345678", "MTN Nigeria", "", daysAgo(75)},
		// Adaeze pays DSTV
		{adaezeID, models.TxTransfer, -9500, 100, 431770.50, 422170.50, models.TxStatusSuccess, "DSTV Compact Plus — subscription renewal", "DSTV", "", daysAgo(65)},
		// Seun sends to Ngozi
		{seunID, models.TxTransfer, -15000, 0, 73000.00, 58000.00, models.TxStatusSuccess, "Transfer to Ngozi Eze — rent contribution", "Ngozi Eze", ngoziID.Hex(), daysAgo(55)},
		// Ngozi receives from Seun
		{ngoziID, models.TxReceive, 15000, 0, 200.00, 15200.00, models.TxStatusSuccess, "Transfer from Oluwaseun Adeyemi", "Oluwaseun Adeyemi", seunID.Hex(), daysAgo(55)},
		// Fatimah pays electricity
		{fatimahID, models.TxTransfer, -12000, 100, 312450.75, 300350.75, models.TxStatusSuccess, "EKEDC electricity prepaid — meter 0001234567", "EKEDC", "", daysAgo(50)},
		// Referral bonus → Adaeze (Emeka referred by her)
		{adaezeID, models.TxReceive, 3000, 0, 422170.50, 425170.50, models.TxStatusSuccess, "Referral bonus — Chukwuemeka Nwosu joined", "OPay", "", daysAgo(89)},
		// Referral bonus → Adaeze (Fatimah referred by her)
		{adaezeID, models.TxReceive, 3000, 0, 425170.50, 428170.50, models.TxStatusSuccess, "Referral bonus — Fatimah Abdullahi joined", "OPay", "", daysAgo(74)},
		// Tunde sends to Amara
		{tundeID, models.TxTransfer, -25000, 0, 923100.25, 898100.25, models.TxStatusSuccess, "Transfer to Amara Osei — project payment", "Amara Osei", amaraID.Hex(), daysAgo(20)},
		// Amara receives from Tunde
		{amaraID, models.TxReceive, 25000, 0, 42500.00, 67500.00, models.TxStatusSuccess, "Payment received from Babatunde Fashola", "Babatunde Fashola", tundeID.Hex(), daysAgo(20)},
		// Emeka pays data
		{emekaID, models.TxTransfer, -3000, 50, 127800.00, 124750.00, models.TxStatusSuccess, "Airtel 10GB data bundle — 08023456789", "Airtel Nigeria", "", daysAgo(40)},
		// Adaeze loan disbursement received
		{adaezeID, models.TxReceive, 100000, 0, 428170.50, 528170.50, models.TxStatusSuccess, "QuickLoan disbursement — approved", "OPay Loans", "", daysAgo(35)},
		// Adaeze repays part of loan
		{adaezeID, models.TxTransfer, -42912, 0, 528170.50, 485258.50, models.TxStatusSuccess, "Loan repayment — month 1 of 3", "OPay Loans", "", daysAgo(5)},
		// Fatimah investment debit
		{fatimahID, models.TxTransfer, -50000, 0, 300350.75, 250350.75, models.TxStatusSuccess, "Investment — Treasury Bills 91-day plan", "OPay Invest", "", daysAgo(30)},
		// Tunde exchange NGN→USD
		{tundeID, models.TxTransfer, -79000, 395, 898100.25, 818705.25, models.TxStatusSuccess, "FX Exchange — NGN 79,000 → USD 50.00", "OPay Exchange", "", daysAgo(10)},
		// Fatimah insurance premium
		{fatimahID, models.TxTransfer, -3500, 0, 250350.75, 246850.75, models.TxStatusSuccess, "Health insurance premium — AXA Mansard", "AXA Mansard", "", daysAgo(8)},
	}

	var txDocs []interface{}
	for _, t := range txs {
		doc := models.Transaction{
			ID:               primitive.NewObjectID(),
			UserID:           t.userID,
			Type:             t.txType,
			Amount:           t.amount,
			Fee:              t.fee,
			BalanceBefore:    t.balanceBefore,
			BalanceAfter:     t.balanceAfter,
			Status:           t.status,
			Reference:        ref("OPY"),
			Description:      t.description,
			CounterpartyName: t.counterpartyName,
			CounterpartyID:   t.counterpartyID,
			CreatedAt:        t.createdAt,
			UpdatedAt:        t.createdAt,
		}
		txDocs = append(txDocs, doc)
	}
	_, err := db.Collection("transactions").InsertMany(ctx, txDocs)
	must(err)
	fmt.Printf("   ✅  %d transactions inserted\n\n", len(txDocs))

	// ═══════════════════════════════════════════════════════════════
	// 4. CARDS
	// ═══════════════════════════════════════════════════════════════
	fmt.Println("💳  Seeding virtual cards…")

	type cardSeed struct {
		userID  primitive.ObjectID
		holder  string
		number  string
		month   int
		year    int
		color   string
		status  models.CardStatus
		created time.Time
	}
	cardDefs := []cardSeed{
		{adaezeID,  "ADAEZE OKONKWO",    "5399830212345670", 12, 2028, "#16a34a", models.CardActive,  daysAgo(100)},
		{adaezeID,  "ADAEZE OKONKWO",    "5399830298765432", 6,  2027, "#0f172a", models.CardFrozen,  daysAgo(60) },
		{emekaID,   "CHUKWUEMEKA NWOSU", "5399830345678901", 9,  2027, "#f59e0b", models.CardActive,  daysAgo(80) },
		{fatimahID, "FATIMAH ABDULLAHI", "5399830423456789", 3,  2028, "#16a34a", models.CardActive,  daysAgo(70) },
		{tundeID,   "BABATUNDE FASHOLA", "5399830556789012", 11, 2029, "#f43f5e", models.CardActive,  daysAgo(25) },
		{amaraID,   "AMARA OSEI",        "5399830667890123", 7,  2027, "#7c3aed", models.CardActive,  daysAgo(14) },
	}

	var cardDocs []interface{}
	for _, c := range cardDefs {
		doc := models.Card{
			ID:          primitive.NewObjectID(),
			UserID:      c.userID,
			Type:        models.CardVirtual,
			CardNumber:  c.number,
			CVV:         fmt.Sprintf("%03d", rand.Intn(1000)),
			ExpiryMonth: c.month,
			ExpiryYear:  c.year,
			CardHolder:  c.holder,
			Network:     "Verve",
			Status:      c.status,
			Color:       c.color,
			CreatedAt:   c.created,
			UpdatedAt:   c.created,
		}
		cardDocs = append(cardDocs, doc)
	}
	_, err = db.Collection("cards").InsertMany(ctx, cardDocs)
	must(err)
	fmt.Printf("   ✅  %d cards inserted\n\n", len(cardDocs))

	// ═══════════════════════════════════════════════════════════════
	// 5. INVESTMENTS
	// ═══════════════════════════════════════════════════════════════
	fmt.Println("📈  Seeding investments…")

	type invSeed struct {
		userID    primitive.ObjectID
		name      string
		invType   models.InvestmentType
		principal float64
		rate      float64
		tenure    int
		unit      string
		status    models.InvestmentStatus
		created   time.Time
		maturity  time.Time
	}

	invDefs := []invSeed{
		{adaezeID,  "Money Market Fund",  models.InvMoneyMarket,  150000, 12.5, 365, "days",   models.InvActive,     daysAgo(90),  daysFrom(275)},
		{fatimahID, "Treasury Bills 91d", models.InvTreasuryBill, 50000,  19.2, 91,  "days",   models.InvActive,     daysAgo(30),  daysFrom(61) },
		{tundeID,   "Fixed Income Bond",  models.InvFixedIncome,  500000, 15.5, 6,   "months", models.InvActive,     daysAgo(15),  daysFrom(165)},
		{emekaID,   "Mutual Fund Growth", models.InvMutualFund,   80000,  22.0, 12,  "months", models.InvActive,     daysAgo(45),  daysFrom(320)},
		{adaezeID,  "Treasury Bills 91d", models.InvTreasuryBill, 75000,  19.0, 91,  "days",   models.InvMatured,    daysAgo(120), daysAgo(29)  },
		{seunID,    "Money Market Fund",  models.InvMoneyMarket,  25000,  12.5, 30,  "days",   models.InvActive,     daysAgo(10),  daysFrom(20) },
	}

	var invDocs []interface{}
	for _, i := range invDefs {
		returnAmt := round2(i.principal * i.rate / 100 * float64(i.tenure) / 365)
		doc := models.Investment{
			ID:              primitive.NewObjectID(),
			UserID:          i.userID,
			Name:            i.name,
			Type:            i.invType,
			PrincipalAmount: i.principal,
			CurrentValue:    round2(i.principal + returnAmt),
			ReturnRate:      i.rate,
			ReturnAmount:    returnAmt,
			Tenure:          i.tenure,
			TenureUnit:      i.unit,
			MaturityDate:    i.maturity,
			Status:          i.status,
			CreatedAt:       i.created,
			UpdatedAt:       i.created,
		}
		invDocs = append(invDocs, doc)
	}
	_, err = db.Collection("investments").InsertMany(ctx, invDocs)
	must(err)
	fmt.Printf("   ✅  %d investments inserted\n\n", len(invDocs))

	// ═══════════════════════════════════════════════════════════════
	// 6. LOANS
	// ═══════════════════════════════════════════════════════════════
	fmt.Println("💰  Seeding loans…")

	type loanSeed struct {
		userID    primitive.ObjectID
		productID string
		amount    float64
		tenure    int
		rate      float64
		purpose   string
		status    models.LoanStatus
		created   time.Time
	}

	calcLoan := func(p, rPct float64, n int) (monthly, total, interest float64) {
		r := rPct / 100
		pn := math.Pow(1+r, float64(n))
		monthly = round2(p * r * pn / (pn - 1))
		total = round2(monthly * float64(n))
		interest = round2(total - p)
		return
	}

	loanDefs := []loanSeed{
		{adaezeID,  "quickloan",     100000, 3, 4.0, "Working capital for my fashion business inventory", models.LoanActive,   daysAgo(35)},
		{emekaID,   "salaryadvance",  50000, 1, 2.5, "Salary advance to cover school fees payment",       models.LoanRepaid,   daysAgo(60)},
		{seunID,    "emergencyloan",  20000, 1, 5.0, "Emergency home repair after roof damage from rain",  models.LoanOverdue,  daysAgo(40)},
		{fatimahID, "businessloan",  200000, 6, 3.5, "Expand catering business equipment and supplies",   models.LoanApproved, daysAgo(3) },
		{tundeID,   "quickloan",      75000, 2, 4.0, "Bridge finance for real estate deposit",            models.LoanRepaid,   daysAgo(90)},
	}

	var loanDocs []interface{}
	now := time.Now()
	for _, l := range loanDefs {
		monthly, total, interest := calcLoan(l.amount, l.rate, l.tenure)
		disbursedAt := l.created
		dueDate := l.created.AddDate(0, l.tenure, 0)
		doc := models.Loan{
			ID:               primitive.NewObjectID(),
			UserID:           l.userID,
			ProductID:        l.productID,
			Amount:           l.amount,
			Tenure:           l.tenure,
			InterestRate:     l.rate,
			MonthlyRepayment: monthly,
			TotalRepayment:   total,
			InterestAmount:   interest,
			Purpose:          l.purpose,
			Status:           l.status,
			DisbursedAt:      &disbursedAt,
			DueDate:          &dueDate,
			CreatedAt:        l.created,
			UpdatedAt:        now,
		}
		loanDocs = append(loanDocs, doc)
	}
	_, err = db.Collection("loans").InsertMany(ctx, loanDocs)
	must(err)
	fmt.Printf("   ✅  %d loans inserted\n\n", len(loanDocs))

	// ═══════════════════════════════════════════════════════════════
	// 7. REFERRALS  (Adaeze referred Emeka + Fatimah; Emeka referred Ngozi; Fatimah referred Tunde)
	// ═══════════════════════════════════════════════════════════════
	fmt.Println("🎁  Seeding referrals…")

	type refSeed struct {
		referrerID  primitive.ObjectID
		refereeID   primitive.ObjectID
		refereeName string
		bonus       float64
		status      string
		created     time.Time
	}
	refDefs := []refSeed{
		{adaezeID,  emekaID,   "Chukwuemeka Nwosu",  3000, "paid",    daysAgo(89)},
		{adaezeID,  fatimahID, "Fatimah Abdullahi",  3000, "paid",    daysAgo(74)},
		{emekaID,   ngoziID,   "Ngozi Eze",          3000, "paid",    daysAgo(44)},
		{fatimahID, tundeID,   "Babatunde Fashola",  3000, "paid",    daysAgo(29)},
		{adaezeID,  amaraID,   "Amara Osei",         3000, "pending", daysAgo(14)},
	}

	var refDocs []interface{}
	for _, r := range refDefs {
		doc := models.Referral{
			ID:          primitive.NewObjectID(),
			ReferrerID:  r.referrerID,
			RefereeID:   r.refereeID,
			RefereeName: r.refereeName,
			BonusAmount: r.bonus,
			Status:      r.status,
			CreatedAt:   r.created,
		}
		refDocs = append(refDocs, doc)
	}
	_, err = db.Collection("referrals").InsertMany(ctx, refDocs)
	must(err)
	fmt.Printf("   ✅  %d referrals inserted\n\n", len(refDocs))

	// ═══════════════════════════════════════════════════════════════
	// 8. EXCHANGE TRANSACTIONS
	// ═══════════════════════════════════════════════════════════════
	fmt.Println("🔄  Seeding exchange transactions…")

	type fxSeed struct {
		userID  primitive.ObjectID
		from    string
		to      string
		fromAmt float64
		toAmt   float64
		rate    float64
		fee     float64
		created time.Time
	}
	fxDefs := []fxSeed{
		{tundeID,   "NGN", "USD", 79000,  50.00,    0.000633, 395.00,  daysAgo(10)},
		{adaezeID,  "NGN", "GBP", 50860,  25.00,    0.000492, 254.30,  daysAgo(20)},
		{fatimahID, "NGN", "EUR", 34405,  20.00,    0.000581, 172.03,  daysAgo(18)},
		{emekaID,   "NGN", "USD", 15800,  10.00,    0.000633, 79.00,   daysAgo(35)},
		{tundeID,   "NGN", "GBP", 81140,  40.00,    0.000493, 405.70,  daysAgo(5) },
	}

	var fxDocs []interface{}
	for _, f := range fxDefs {
		doc := models.ExchangeTransaction{
			ID:           primitive.NewObjectID(),
			UserID:       f.userID,
			FromCurrency: f.from,
			ToCurrency:   f.to,
			FromAmount:   f.fromAmt,
			ToAmount:     f.toAmt,
			Rate:         f.rate,
			Fee:          f.fee,
			Status:       "success",
			Reference:    ref("FX"),
			CreatedAt:    f.created,
		}
		fxDocs = append(fxDocs, doc)
	}
	_, err = db.Collection("exchange_transactions").InsertMany(ctx, fxDocs)
	must(err)
	fmt.Printf("   ✅  %d exchange transactions inserted\n\n", len(fxDocs))

	// ═══════════════════════════════════════════════════════════════
	// 9. INSURANCE POLICIES
	// ═══════════════════════════════════════════════════════════════
	fmt.Println("🛡️  Seeding insurance policies…")

	type insSeed struct {
		userID  primitive.ObjectID
		insType models.InsuranceType
		name    string
		premium float64
		coverage float64
		policyNo string
		status  models.InsuranceStatus
		created time.Time
	}
	insDefs := []insSeed{
		{adaezeID,  models.InsuranceHealth, "Health Shield Premium",  12000, 15000000, "AXA-HLT-00123", models.InsuranceActive,  daysAgo(60)},
		{fatimahID, models.InsuranceHealth, "Health Shield Basic",    3500,  5000000,  "AXA-HLT-00456", models.InsuranceActive,  daysAgo(8) },
		{tundeID,   models.InsuranceAuto,   "Auto Comprehensive",     12500, 20000000, "AIG-AUT-00789", models.InsuranceActive,  daysAgo(20)},
		{emekaID,   models.InsuranceLife,   "Term Life — 10yr",       2500,  10000000, "NEM-LIF-01012", models.InsuranceActive,  daysAgo(45)},
		{adaezeID,  models.InsuranceAuto,   "Third Party Vehicle",    3500,  2000000,  "AIG-AUT-01345", models.InsuranceExpired, daysAgo(400)},
	}

	var insDocs []interface{}
	for _, i := range insDefs {
		doc := models.Insurance{
			ID:           primitive.NewObjectID(),
			UserID:       i.userID,
			Type:         i.insType,
			Name:         i.name,
			Provider:     "AXA Mansard",
			Premium:      i.premium,
			Coverage:     i.coverage,
			PolicyNumber: i.policyNo,
			Status:       i.status,
			StartDate:    i.created,
			EndDate:      i.created.AddDate(1, 0, 0),
			CreatedAt:    i.created,
		}
		insDocs = append(insDocs, doc)
	}
	_, err = db.Collection("insurances").InsertMany(ctx, insDocs)
	must(err)
	fmt.Printf("   ✅  %d insurance policies inserted\n\n", len(insDocs))

	// ═══════════════════════════════════════════════════════════════
	// 10. SAVINGS PLANS
	// ═══════════════════════════════════════════════════════════════
	fmt.Println("🏦  Seeding savings plans…")

	type savSeed struct {
		userID      primitive.ObjectID
		name        string
		emoji       string
		savType     string
		target      float64
		current     float64
		rate        float64
		interest    float64
		autoSave    bool
		freq        string
		endDate     *time.Time
		status      string
		created     time.Time
	}

	endQ1 := daysFrom(45)
	endQ2 := daysFrom(120)
	endQ3 := daysFrom(200)

	savDefs := []savSeed{
		{adaezeID,  "Emergency Fund",      "🛡️", "flex",   500000, 185000, 6.0,  925,   true,  "weekly",   nil,   "active", daysAgo(100)},
		{adaezeID,  "Dubai Vacation ✈️",   "✈️", "target", 350000, 215000, 10.0, 2150,  true,  "monthly",  &endQ1,"active", daysAgo(60) },
		{fatimahID, "New Laptop 💻",       "💻", "target", 280000, 70000,  10.0, 700,   false, "monthly",  &endQ2,"active", daysAgo(30) },
		{fatimahID, "Business Capital",    "💼", "fixed",  1000000,500000, 15.0, 7500,  false, "monthly",  &endQ3,"active", daysAgo(45) },
		{emekaID,   "House Rent",          "🏠", "target", 450000, 180000, 8.0,  1440,  true,  "weekly",   nil,   "active", daysAgo(50) },
		{tundeID,   "Investment Top-Up",   "📈", "flex",   2000000,750000, 6.0,  3750,  true,  "daily",    nil,   "active", daysAgo(20) },
		{seunID,    "School Fees",         "🎓", "target", 120000, 40000,  10.0, 400,   true,  "weekly",   nil,   "active", daysAgo(25) },
		{amaraID,   "Wedding Fund 💍",     "💍", "fixed",  500000, 125000, 15.0, 1875,  false, "monthly",  &endQ2,"active", daysAgo(15) },
	}

	type savingsDoc struct {
		ID           primitive.ObjectID `bson:"_id,omitempty"`
		UserID       primitive.ObjectID `bson:"userId"`
		Name         string             `bson:"name"`
		Emoji        string             `bson:"emoji"`
		Type         string             `bson:"type"`
		TargetAmount float64            `bson:"targetAmount"`
		CurrentAmount float64           `bson:"currentAmount"`
		InterestRate float64            `bson:"interestRate"`
		InterestEarned float64          `bson:"interestEarned"`
		AutoSave     bool               `bson:"autoSave"`
		Frequency    string             `bson:"frequency"`
		EndDate      *time.Time         `bson:"endDate,omitempty"`
		Status       string             `bson:"status"`
		Color        string             `bson:"color"`
		CreatedAt    time.Time          `bson:"createdAt"`
		UpdatedAt    time.Time          `bson:"updatedAt"`
	}

	savColors := []string{"#3b82f6","#8b5cf6","#f59e0b","#16a34a","#ef4444","#0891b2","#f97316","#ec4899"}

	var savDocs []interface{}
	for idx, s := range savDefs {
		doc := savingsDoc{
			ID:             primitive.NewObjectID(),
			UserID:         s.userID,
			Name:           s.name,
			Emoji:          s.emoji,
			Type:           s.savType,
			TargetAmount:   s.target,
			CurrentAmount:  s.current,
			InterestRate:   s.rate,
			InterestEarned: s.interest,
			AutoSave:       s.autoSave,
			Frequency:      s.freq,
			EndDate:        s.endDate,
			Status:         s.status,
			Color:          savColors[idx%len(savColors)],
			CreatedAt:      s.created,
			UpdatedAt:      time.Now(),
		}
		savDocs = append(savDocs, doc)
	}
	_, err = db.Collection("savings_plans").InsertMany(ctx, savDocs)
	must(err)
	fmt.Printf("   ✅  %d savings plans inserted\n\n", len(savDocs))

	// ═══════════════════════════════════════════════════════════════
	// 11. SCHEDULED PAYMENTS
	// ═══════════════════════════════════════════════════════════════
	fmt.Println("🗓  Seeding scheduled payments…")

	type schedSeed struct {
		userID   primitive.ObjectID
		payType  string
		name     string
		amount   float64
		freq     string
		nextRun  time.Time
		lastRun  *time.Time
		active   bool
	}

	lastWeek := daysAgo(7)
	lastMonth := daysAgo(30)

	schedDefs := []schedSeed{
		{adaezeID,  "bill",     "DSTV Compact Plus",    9500,  "monthly", daysFrom(25), &lastMonth, true },
		{adaezeID,  "bill",     "EKEDC Electricity",    15000, "monthly", daysFrom(12), &lastMonth, true },
		{adaezeID,  "savings",  "Dubai Vacation Save",  10000, "weekly",  daysFrom(5),  &lastWeek,  true },
		{fatimahID, "bill",     "MTN Data 30GB",        3500,  "monthly", daysFrom(18), &lastMonth, true },
		{fatimahID, "transfer", "Send to Mum",          20000, "monthly", daysFrom(3),  &lastMonth, true },
		{emekaID,   "savings",  "House Rent AutoSave",  5000,  "weekly",  daysFrom(2),  &lastWeek,  true },
		{tundeID,   "bill",     "GOtv Jolli",           4200,  "monthly", daysFrom(20), &lastMonth, true },
		{tundeID,   "savings",  "Investment Top-Up",    50000, "monthly", daysFrom(8),  &lastMonth, true },
		{seunID,    "bill",     "Airtel Data 10GB",     3000,  "monthly", daysFrom(15), &lastMonth, true },
		{amaraID,   "savings",  "Wedding Fund AutoSave",5000,  "monthly", daysFrom(1),  &lastMonth, true },
	}

	type schedDoc struct {
		ID           primitive.ObjectID `bson:"_id,omitempty"`
		UserID       primitive.ObjectID `bson:"userId"`
		Type         string             `bson:"type"`
		Name         string             `bson:"name"`
		Amount       float64            `bson:"amount"`
		Frequency    string             `bson:"frequency"`
		NextRunDate  time.Time          `bson:"nextRunDate"`
		LastRunDate  *time.Time         `bson:"lastRunDate,omitempty"`
		Active       bool               `bson:"active"`
		CreatedAt    time.Time          `bson:"createdAt"`
	}

	var schedDocs []interface{}
	for _, s := range schedDefs {
		doc := schedDoc{
			ID:          primitive.NewObjectID(),
			UserID:      s.userID,
			Type:        s.payType,
			Name:        s.name,
			Amount:      s.amount,
			Frequency:   s.freq,
			NextRunDate: s.nextRun,
			LastRunDate: s.lastRun,
			Active:      s.active,
			CreatedAt:   daysAgo(rand.Intn(90) + 5),
		}
		schedDocs = append(schedDocs, doc)
	}
	_, err = db.Collection("scheduled_payments").InsertMany(ctx, schedDocs)
	must(err)
	fmt.Printf("   ✅  %d scheduled payments inserted\n\n", len(schedDocs))

	// ═══════════════════════════════════════════════════════════════
	// 12. NOTIFICATIONS
	// ═══════════════════════════════════════════════════════════════
	fmt.Println("🔔  Seeding notifications…")

	type notifSeed struct {
		userID   primitive.ObjectID
		title    string
		body     string
		category string
		iconName string
		isRead   bool
		priority string
		created  time.Time
	}
	notifDefs := []notifSeed{
		{adaezeID,  "Transfer Received 🎉",          "Chukwuemeka Nwosu sent you ₦50,000",                        "transaction", "ArrowDownLeft", false, "high",   daysAgo(80) },
		{adaezeID,  "Referral Bonus Credited!",       "You earned ₦3,000 — Fatimah Abdullahi joined via your link","promo",       "Gift",         false, "medium", daysAgo(74) },
		{adaezeID,  "Investment Tip 📈",              "Your Treasury Bills plan earned ₦2,375 interest. Keep going!","investment",  "TrendingUp",   true,  "low",    daysAgo(30) },
		{adaezeID,  "Loan Payment Due in 5 Days",     "₦42,912 loan repayment due on the 25th. Fund your wallet now","loan",       "Banknote",     false, "high",   daysAgo(5)  },
		{adaezeID,  "Security Alert ⚠️",              "New sign-in from Lagos, Chrome on Windows",                 "security",    "Shield",       false, "high",   daysAgo(2)  },
		{emekaID,   "₦50,000 Transfer Arrived",       "Adaeze Okonkwo sent you money",                             "transaction", "ArrowDownLeft", false, "high",  daysAgo(80) },
		{emekaID,   "Mutual Fund Growing 📊",         "Your Mutual Fund is up ₦1,936. Current value: ₦81,936",     "investment",  "TrendingUp",   true,  "medium", daysAgo(45) },
		{fatimahID, "Treasury Bills Confirmed!",      "₦50,000 placed in Treasury Bills 91-day. Matures Mar 2026", "investment",  "CheckCircle",  false, "high",   daysAgo(30) },
		{fatimahID, "Insurance Premium Deducted",     "₦3,500 Health Shield monthly premium — AXA Mansard",        "transaction", "Shield",       true,  "low",    daysAgo(8)  },
		{fatimahID, "Loan Approved ✅",               "₦200,000 Business Loan approved and disbursing today",      "loan",        "CheckCircle",  false, "high",   daysAgo(3)  },
		{seunID,    "⚠️ Loan Overdue!",               "Your Emergency Loan of ₦20,000 is overdue. Pay now to avoid late fees","loan","AlertTriangle",false,"high",  daysAgo(10) },
		{tundeID,   "FX Exchange Complete",           "₦79,000 → $50.00 exchange successful. Check your FX wallet","transaction", "ArrowLeftRight",false,"medium", daysAgo(10) },
		{tundeID,   "Big Saver! 🏆",                  "You've saved ₦750,000 in OWealth — top 5% of savers!",      "promo",       "Trophy",        true, "low",    daysAgo(20) },
		{amaraID,   "Welcome to OPay! 🎉",            "Start earning by saving, investing and referring friends",   "system",      "Sparkles",      false,"medium", daysAgo(15) },
		{amaraID,   "₦25,000 Received",               "Babatunde Fashola sent you ₦25,000 — project payment",      "transaction", "ArrowDownLeft", false,"high",   daysAgo(20) },
	}

	type notifDoc struct {
		ID        primitive.ObjectID `bson:"_id,omitempty"`
		UserID    primitive.ObjectID `bson:"userId"`
		Title     string             `bson:"title"`
		Body      string             `bson:"body"`
		Category  string             `bson:"category"`
		IconName  string             `bson:"iconName"`
		IsRead    bool               `bson:"isRead"`
		Priority  string             `bson:"priority"`
		CreatedAt time.Time          `bson:"createdAt"`
	}

	var notifDocs []interface{}
	for _, n := range notifDefs {
		doc := notifDoc{
			ID:        primitive.NewObjectID(),
			UserID:    n.userID,
			Title:     n.title,
			Body:      n.body,
			Category:  n.category,
			IconName:  n.iconName,
			IsRead:    n.isRead,
			Priority:  n.priority,
			CreatedAt: n.created,
		}
		notifDocs = append(notifDocs, doc)
	}
	_, err = db.Collection("notifications").InsertMany(ctx, notifDocs)
	must(err)
	fmt.Printf("   ✅  %d notifications inserted\n\n", len(notifDocs))

	// ═══════════════════════════════════════════════════════════════
	// 13. BUDGETS
	// ═══════════════════════════════════════════════════════════════
	fmt.Println("💼  Seeding budgets…")

	type budgetCategory struct {
		Category  string  `bson:"category"`
		Allocated float64 `bson:"allocated"`
		Spent     float64 `bson:"spent"`
		Color     string  `bson:"color"`
	}

	type budgetDoc struct {
		ID          primitive.ObjectID `bson:"_id,omitempty"`
		UserID      primitive.ObjectID `bson:"userId"`
		Name        string             `bson:"name"`
		TotalBudget float64            `bson:"totalBudget"`
		Spent       float64            `bson:"spent"`
		Month       string             `bson:"month"`
		Categories  []budgetCategory   `bson:"categories"`
		CreatedAt   time.Time          `bson:"createdAt"`
	}

	budgetCols := []string{"#16a34a","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#ec4899"}

	budgets := []budgetDoc{
		{
			ID: primitive.NewObjectID(), UserID: adaezeID,
			Name: "March 2026 Budget", TotalBudget: 200000,
			Month: "2026-03", CreatedAt: daysAgo(5),
			Categories: []budgetCategory{
				{"Food & Dining",     50000, 38500, budgetCols[0]},
				{"Transport",         20000, 14200, budgetCols[1]},
				{"Entertainment",     15000, 9800,  budgetCols[2]},
				{"Bills & Utilities", 40000, 24500, budgetCols[3]},
				{"Shopping",          30000, 22100, budgetCols[4]},
				{"Healthcare",        20000, 3500,  budgetCols[5]},
				{"Savings",           25000, 25000, budgetCols[6]},
			},
		},
		{
			ID: primitive.NewObjectID(), UserID: tundeID,
			Name: "March 2026 Budget", TotalBudget: 500000,
			Month: "2026-03", CreatedAt: daysAgo(3),
			Categories: []budgetCategory{
				{"Food & Dining",     80000, 51000,  budgetCols[0]},
				{"Transport",         60000, 44000,  budgetCols[1]},
				{"Entertainment",     30000, 28000,  budgetCols[2]},
				{"Bills & Utilities", 100000,87500,  budgetCols[3]},
				{"Business Expenses", 150000,120000, budgetCols[4]},
				{"Savings",           80000, 80000,  budgetCols[6]},
			},
		},
	}

	var budgetDocs []interface{}
	for _, b := range budgets {
		b.Spent = 0
		for _, c := range b.Categories {
			b.Spent += c.Spent
		}
		budgetDocs = append(budgetDocs, b)
	}
	_, err = db.Collection("budgets").InsertMany(ctx, budgetDocs)
	must(err)
	fmt.Printf("   ✅  %d budgets inserted\n\n", len(budgetDocs))

	// ═══════════════════════════════════════════════════════════════
	// 14. CONTACTS / BENEFICIARIES
	// ═══════════════════════════════════════════════════════════════
	fmt.Println("👥  Seeding contacts…")

	type contactDoc struct {
		ID              primitive.ObjectID `bson:"_id,omitempty"`
		OwnerID         primitive.ObjectID `bson:"ownerId"`
		Name            string             `bson:"name"`
		Email           string             `bson:"email"`
		Phone           string             `bson:"phone,omitempty"`
		AvatarColor     string             `bson:"avatarColor"`
		Initials        string             `bson:"initials"`
		IsFavorite      bool               `bson:"isFavorite"`
		LastTransferAmt float64            `bson:"lastTransferAmount,omitempty"`
		LastTransferAt  *time.Time         `bson:"lastTransferDate,omitempty"`
		CreatedAt       time.Time          `bson:"createdAt"`
	}

	avatarCols := []string{"#16a34a","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316"}
	getInitials := func(name string) string {
		parts := strings.Fields(name)
		if len(parts) >= 2 {
			return strings.ToUpper(string(parts[0][0])) + strings.ToUpper(string(parts[1][0]))
		}
		return strings.ToUpper(string(name[0]))
	}

	lta80 := daysAgo(80)
	lta55 := daysAgo(55)
	lta20 := daysAgo(20)
	lta40 := daysAgo(40)

	contactDefs := []contactDoc{
		// Adaeze's contacts
		{primitive.NewObjectID(), adaezeID,  "Chukwuemeka Nwosu",  "emeka@opay.ng",    "08023456789", avatarCols[0], getInitials("Chukwuemeka Nwosu"),  true,  50000, &lta80, daysAgo(80)},
		{primitive.NewObjectID(), adaezeID,  "Fatimah Abdullahi",  "fatimah@opay.ng",  "08034567890", avatarCols[1], getInitials("Fatimah Abdullahi"),   true,  20000, nil,    daysAgo(75)},
		{primitive.NewObjectID(), adaezeID,  "Babatunde Fashola",  "tunde@opay.ng",    "08067890123", avatarCols[2], getInitials("Babatunde Fashola"),    false, 0,     nil,    daysAgo(30)},
		{primitive.NewObjectID(), adaezeID,  "Amara Osei",         "amara@opay.ng",    "08078901234", avatarCols[3], getInitials("Amara Osei"),           false, 0,     nil,    daysAgo(14)},
		// Emeka's contacts
		{primitive.NewObjectID(), emekaID,   "Adaeze Okonkwo",     "adaeze@opay.ng",   "08012345678", avatarCols[4], getInitials("Adaeze Okonkwo"),       true,  0,     nil,    daysAgo(80)},
		{primitive.NewObjectID(), emekaID,   "Ngozi Eze",          "ngozi@opay.ng",    "08056789012", avatarCols[5], getInitials("Ngozi Eze"),             false, 0,     nil,    daysAgo(44)},
		// Seun's contacts
		{primitive.NewObjectID(), seunID,    "Ngozi Eze",          "ngozi@opay.ng",    "08056789012", avatarCols[0], getInitials("Ngozi Eze"),             true,  15000, &lta55, daysAgo(55)},
		// Tunde's contacts
		{primitive.NewObjectID(), tundeID,   "Amara Osei",         "amara@opay.ng",    "08078901234", avatarCols[1], getInitials("Amara Osei"),            true,  25000, &lta20, daysAgo(20)},
		{primitive.NewObjectID(), tundeID,   "Adaeze Okonkwo",     "adaeze@opay.ng",   "08012345678", avatarCols[2], getInitials("Adaeze Okonkwo"),        false, 0,     nil,    daysAgo(10)},
		// Fatimah's contacts
		{primitive.NewObjectID(), fatimahID, "Adaeze Okonkwo",     "adaeze@opay.ng",   "08012345678", avatarCols[3], getInitials("Adaeze Okonkwo"),        true,  0,     nil,    daysAgo(40)},
		{primitive.NewObjectID(), fatimahID, "Chukwuemeka Nwosu",  "emeka@opay.ng",    "08023456789", avatarCols[0], getInitials("Chukwuemeka Nwosu"),     false, 10000, &lta40, daysAgo(40)},
	}

	var contactDocs []interface{}
	for _, c := range contactDefs {
		contactDocs = append(contactDocs, c)
	}
	_, err = db.Collection("contacts").InsertMany(ctx, contactDocs)
	must(err)
	fmt.Printf("   ✅  %d contacts inserted\n\n", len(contactDocs))

	// ═══════════════════════════════════════════════════════════════
	// 15. SUPPORT TICKETS
	// ═══════════════════════════════════════════════════════════════
	fmt.Println("🎫  Seeding support tickets…")

	type ticketMsg struct {
		ID        string    `bson:"id"`
		Sender    string    `bson:"sender"`
		Body      string    `bson:"body"`
		CreatedAt time.Time `bson:"createdAt"`
	}
	type ticketDoc struct {
		ID        primitive.ObjectID `bson:"_id,omitempty"`
		UserID    primitive.ObjectID `bson:"userId"`
		Subject   string             `bson:"subject"`
		Category  string             `bson:"category"`
		Status    string             `bson:"status"`
		Messages  []ticketMsg        `bson:"messages"`
		CreatedAt time.Time          `bson:"createdAt"`
	}

	tickets := []ticketDoc{
		{
			ID: primitive.NewObjectID(), UserID: adaezeID,
			Subject: "Transfer pending for 2 hours", Category: "transaction", Status: "resolved",
			CreatedAt: daysAgo(72),
			Messages: []ticketMsg{
				{"msg1", "user",  "My transfer of ₦50,000 to Emeka is still pending after 2 hours.", daysAgo(72)},
				{"msg2", "agent", "Hi Adaeze! We investigated and the transfer has been completed. The delay was due to high traffic.", daysAgo(71)},
				{"msg3", "user",  "Thank you! I can see it now.", daysAgo(71)},
			},
		},
		{
			ID: primitive.NewObjectID(), UserID: fatimahID,
			Subject: "How do I increase my loan limit?", Category: "loan", Status: "in_progress",
			CreatedAt: daysAgo(5),
			Messages: []ticketMsg{
				{"msg1", "user",  "I want to apply for a ₦500K business loan but my limit shows ₦200K. How can I increase this?", daysAgo(5)},
				{"msg2", "agent", "Hello Fatimah! Your loan limit is based on your credit score and KYC tier. Complete Tier 3 KYC to unlock higher limits.", daysAgo(4)},
			},
		},
		{
			ID: primitive.NewObjectID(), UserID: seunID,
			Subject: "Overdue loan — request for extension", Category: "loan", Status: "open",
			CreatedAt: daysAgo(3),
			Messages: []ticketMsg{
				{"msg1", "user", "I have an overdue emergency loan of ₦20,000. I'm currently facing financial difficulty. Can you grant a 14-day extension?", daysAgo(3)},
			},
		},
	}

	var ticketDocs []interface{}
	for _, t := range tickets {
		ticketDocs = append(ticketDocs, t)
	}
	_, err = db.Collection("support_tickets").InsertMany(ctx, ticketDocs)
	must(err)
	fmt.Printf("   ✅  %d support tickets inserted\n\n", len(ticketDocs))

	// ═══════════════════════════════════════════════════════════════
	// 16. CASHBACK EARNED
	// ═══════════════════════════════════════════════════════════════
	fmt.Println("🎁  Seeding cashback earned…")

	type cbEarned struct {
		ID        primitive.ObjectID `bson:"_id,omitempty"`
		UserID    primitive.ObjectID `bson:"userId"`
		OfferID   string             `bson:"offerId"`
		Merchant  string             `bson:"merchant"`
		Amount    float64            `bson:"amount"`
		TxRef     string             `bson:"txRef"`
		CreatedAt time.Time          `bson:"createdAt"`
	}

	cbDefs := []cbEarned{
		{primitive.NewObjectID(), adaezeID,  "cb5", "DSTV",        475, ref("CB"), daysAgo(65)},
		{primitive.NewObjectID(), adaezeID,  "cb4", "MTN Airtime", 105, ref("CB"), daysAgo(75)},
		{primitive.NewObjectID(), adaezeID,  "cb2", "Uber",        350, ref("CB"), daysAgo(30)},
		{primitive.NewObjectID(), fatimahID, "cb3", "Netflix",     400, ref("CB"), daysAgo(20)},
		{primitive.NewObjectID(), emekaID,   "cb4", "MTN Airtime",  90, ref("CB"), daysAgo(40)},
		{primitive.NewObjectID(), tundeID,   "cb1", "Jumia",       1250, ref("CB"), daysAgo(15)},
		{primitive.NewObjectID(), tundeID,   "cb5", "DSTV",         210, ref("CB"), daysAgo(30)},
	}

	var cbDocs []interface{}
	for _, c := range cbDefs {
		cbDocs = append(cbDocs, c)
	}
	_, err = db.Collection("cashback_earned").InsertMany(ctx, cbDocs)
	must(err)
	fmt.Printf("   ✅  %d cashback records inserted\n\n", len(cbDocs))

	// ═══════════════════════════════════════════════════════════════
	// BATCH 5 SEED DATA
	// ═══════════════════════════════════════════════════════════════

	// ── Airtime Purchases ──────────────────────────────────────────
	fmt.Println("📱  Seeding airtime purchases…")
	type airtimeDoc struct {
		ID        primitive.ObjectID `bson:"_id,omitempty"`
		UserID    primitive.ObjectID `bson:"userId"`
		Network   string             `bson:"network"`
		Phone     string             `bson:"phone"`
		Amount    float64            `bson:"amount"`
		PlanType  string             `bson:"planType"`
		DataPlan  string             `bson:"dataPlan"`
		Reference string             `bson:"reference"`
		Status    string             `bson:"status"`
		CreatedAt time.Time          `bson:"createdAt"`
	}
	airtimeDocs := []interface{}{
		airtimeDoc{primitive.NewObjectID(),adaezeID,"MTN",    "08012345678",500,"airtime","","AIR-A1B2C3D4","success",daysAgo(2)},
		airtimeDoc{primitive.NewObjectID(),adaezeID,"Airtel", "07087654321",1500,"data","air2gb","AIR-E5F6G7H8","success",daysAgo(7)},
		airtimeDoc{primitive.NewObjectID(),tundeID, "Glo",    "08134567890",200,"airtime","","AIR-I9J0K1L2","success",daysAgo(5)},
		airtimeDoc{primitive.NewObjectID(),emekaID, "MTN",    "08023456789",3000,"data","mtn10gb","AIR-M3N4O5P6","success",daysAgo(14)},
	}
	_, _ = db.Collection("airtime_purchases").InsertMany(ctx, airtimeDocs)
	fmt.Printf("   ✅  %d airtime purchases inserted\n\n", len(airtimeDocs))

	// ── Bill Payments ──────────────────────────────────────────────
	fmt.Println("🏠  Seeding bill payments…")
	type billDoc struct {
		ID         primitive.ObjectID `bson:"_id,omitempty"`
		UserID     primitive.ObjectID `bson:"userId"`
		Category   string             `bson:"category"`
		Provider   string             `bson:"provider"`
		AccountNum string             `bson:"accountNum"`
		Amount     float64            `bson:"amount"`
		Token      string             `bson:"token"`
		Reference  string             `bson:"reference"`
		Status     string             `bson:"status"`
		CreatedAt  time.Time          `bson:"createdAt"`
	}
	billDocs := []interface{}{
		billDoc{primitive.NewObjectID(),adaezeID,"electricity","EKEDC (Eko)","4500127890",5000,"1234-5678-9012-3456-7890","BIL-A1B2C3D4","success",daysAgo(3)},
		billDoc{primitive.NewObjectID(),adaezeID,"cable_tv","DStv","8012345678",7900,"","BIL-E5F6G7H8","success",daysAgo(25)},
		billDoc{primitive.NewObjectID(),tundeID,"internet","Spectranet","SPT-001234",15000,"","BIL-I9J0K1L2","success",daysAgo(10)},
		billDoc{primitive.NewObjectID(),emekaID,"electricity","AEDC (Abuja)","3201987654",3000,"9988-7766-5544-3322-1100","BIL-M3N4O5P6","success",daysAgo(6)},
	}
	_, _ = db.Collection("bill_payments").InsertMany(ctx, billDocs)
	fmt.Printf("   ✅  %d bill payments inserted\n\n", len(billDocs))

	// ── Crypto Wallets & Transactions ──────────────────────────────
	fmt.Println("₿   Seeding crypto wallets…")
	type cryptoWalletDoc struct {
		ID        primitive.ObjectID `bson:"_id,omitempty"`
		UserID    primitive.ObjectID `bson:"userId"`
		Balances  map[string]float64 `bson:"balances"`
		UpdatedAt time.Time          `bson:"updatedAt"`
	}
	cryptoWalletDocs := []interface{}{
		cryptoWalletDoc{primitive.NewObjectID(),adaezeID,map[string]float64{"BTC":0.002,"ETH":0.05,"USDT":50},time.Now()},
		cryptoWalletDoc{primitive.NewObjectID(),tundeID, map[string]float64{"BTC":0.01,"SOL":2,"BNB":0.5},time.Now()},
	}
	_, _ = db.Collection("crypto_wallets").InsertMany(ctx, cryptoWalletDocs)
	fmt.Printf("   ✅  %d crypto wallets inserted\n\n", len(cryptoWalletDocs))

// ═══════════════════════════════════════════════════════════════
	// BATCH 4 SEED DATA
	// ═══════════════════════════════════════════════════════════════

	// ── Social Activity Feed ──────────────────────────────────────
	fmt.Println("📣  Seeding social activities…")
	type socialReactionDoc struct {
		UserID    primitive.ObjectID `bson:"userId"`
		Emoji     string             `bson:"emoji"`
		CreatedAt time.Time          `bson:"createdAt"`
	}
	type socialDoc struct {
		ID           primitive.ObjectID    `bson:"_id,omitempty"`
		UserID       primitive.ObjectID    `bson:"userId"`
		UserName     string                `bson:"userName"`
		UserInitials string                `bson:"userInitials"`
		AvatarColor  string                `bson:"avatarColor"`
		Type         string                `bson:"type"`
		Caption      string                `bson:"caption"`
		Amount       float64               `bson:"amount"`
		IsPublic     bool                  `bson:"isPublic"`
		Reactions    []socialReactionDoc   `bson:"reactions"`
		CommentCount int                   `bson:"commentCount"`
		CreatedAt    time.Time             `bson:"createdAt"`
	}
	socialDocs := []interface{}{
		socialDoc{primitive.NewObjectID(),tundeID,"Babatunde Fashola","BF","#8b5cf6","investment","Just invested ₦500,000 in Fixed Income bonds 📈",500000,true,[]socialReactionDoc{{emekaID,"🔥",time.Now()},{adaezeID,"👏",time.Now()}},3,daysAgo(1)},
		socialDoc{primitive.NewObjectID(),adaezeID,"Adaeze Okonkwo","AO","#16a34a","savings","Hit my Dubai vacation savings goal! ₦215K saved ✈️",215000,true,[]socialReactionDoc{{tundeID,"❤️",time.Now()},{fatimahID,"🚀",time.Now()}},7,daysAgo(2)},
		socialDoc{primitive.NewObjectID(),fatimahID,"Fatimah Abdullahi","FA","#3b82f6","challenge","Completed the 30-Day No Eating Out Challenge 🏆",0,true,[]socialReactionDoc{{adaezeID,"👑",time.Now()}},5,daysAgo(3)},
		socialDoc{primitive.NewObjectID(),emekaID,"Chukwuemeka Nwosu","CN","#f59e0b","send","Sent ₦50,000 to my business partner. Growing everyday 💼",50000,true,[]socialReactionDoc{},2,daysAgo(4)},
	}
	_, _ = db.Collection("social_activities").InsertMany(ctx, socialDocs)
	fmt.Printf("   ✅  %d social posts inserted\n\n", len(socialDocs))

	// ── Portfolio Holdings ─────────────────────────────────────────
	fmt.Println("📊  Seeding portfolio holdings…")
	type holdingDoc struct {
		ID           primitive.ObjectID `bson:"_id,omitempty"`
		UserID       primitive.ObjectID `bson:"userId"`
		Symbol       string             `bson:"symbol"`
		Name         string             `bson:"name"`
		Type         string             `bson:"type"`
		Quantity     float64            `bson:"quantity"`
		AvgBuyPrice  float64            `bson:"avgBuyPrice"`
		CurrentPrice float64            `bson:"currentPrice"`
		TotalCost    float64            `bson:"totalCost"`
		CurrentValue float64            `bson:"currentValue"`
		PnL          float64            `bson:"pnl"`
		PnLPercent   float64            `bson:"pnlPercent"`
		Color        string             `bson:"color"`
		CreatedAt    time.Time          `bson:"createdAt"`
		UpdatedAt    time.Time          `bson:"updatedAt"`
	}
	holdingDocs := []interface{}{
		holdingDoc{primitive.NewObjectID(),adaezeID,"DANGOTE","Dangote Cement","stock",500,350.00,380.50,175000,190250,15250,8.71,"#16a34a",daysAgo(120),time.Now()},
		holdingDoc{primitive.NewObjectID(),adaezeID,"MTNN","MTN Nigeria","stock",200,230.00,248.00,46000,49600,3600,7.83,"#f97316",daysAgo(90),time.Now()},
		holdingDoc{primitive.NewObjectID(),adaezeID,"BTC","Bitcoin","crypto",0.002,75000000,97000000,150000,194000,44000,29.33,"#f97316",daysAgo(60),time.Now()},
		holdingDoc{primitive.NewObjectID(),tundeID,"ZENITH","Zenith Bank","stock",10000,38.50,42.80,385000,428000,43000,11.17,"#8b5cf6",daysAgo(180),time.Now()},
		holdingDoc{primitive.NewObjectID(),tundeID,"ETH","Ethereum","crypto",0.05,4800000,5400000,240000,270000,30000,12.50,"#6366f1",daysAgo(45),time.Now()},
	}
	_, _ = db.Collection("portfolio_holdings").InsertMany(ctx, holdingDocs)
	fmt.Printf("   ✅  %d portfolio holdings inserted\n\n", len(holdingDocs))

	// ── Payment Links ──────────────────────────────────────────────
	fmt.Println("🔗  Seeding payment links…")
	type payLinkDoc struct {
		ID             primitive.ObjectID `bson:"_id,omitempty"`
		UserID         primitive.ObjectID `bson:"userId"`
		Title          string             `bson:"title"`
		Description    string             `bson:"description"`
		Amount         float64            `bson:"amount"`
		IsFixedAmount  bool               `bson:"isFixedAmount"`
		Slug           string             `bson:"slug"`
		URL            string             `bson:"url"`
		Status         string             `bson:"status"`
		TotalCollected float64            `bson:"totalCollected"`
		PaymentCount   int                `bson:"paymentCount"`
		CreatedAt      time.Time          `bson:"createdAt"`
	}
	payLinkDocs := []interface{}{
		payLinkDoc{primitive.NewObjectID(),adaezeID,"Adaeze Fabrics Order","Payment for custom Ankara outfits",45000,true,"adaeze-fabrics-8742","https://pay.opay.ng/adaeze-fabrics-8742","active",225000,5,daysAgo(30)},
		payLinkDoc{primitive.NewObjectID(),adaezeID,"Catering Deposit","50% deposit for event catering services",75000,true,"catering-deposit-2231","https://pay.opay.ng/catering-deposit-2231","active",75000,1,daysAgo(10)},
		payLinkDoc{primitive.NewObjectID(),tundeID,"Property Consultation Fee","Initial consultation for real estate advice",50000,false,"property-consult-5510","https://pay.opay.ng/property-consult-5510","active",200000,4,daysAgo(45)},
	}
	_, _ = db.Collection("payment_links").InsertMany(ctx, payLinkDocs)
	fmt.Printf("   ✅  %d payment links inserted\n\n", len(payLinkDocs))

// ═══════════════════════════════════════════════════════════════
	// BATCH 3 SEED DATA
	// ═══════════════════════════════════════════════════════════════

	// ── Saved Bank Accounts ───────────────────────────────────────
	fmt.Println("🏦  Seeding bank accounts…")
	type bankAccDoc struct {
		ID            primitive.ObjectID `bson:"_id,omitempty"`
		UserID        primitive.ObjectID `bson:"userId"`
		BankName      string             `bson:"bankName"`
		BankCode      string             `bson:"bankCode"`
		AccountNumber string             `bson:"accountNumber"`
		AccountName   string             `bson:"accountName"`
		IsDefault     bool               `bson:"isDefault"`
		CreatedAt     time.Time          `bson:"createdAt"`
	}
	bankAccDocs := []interface{}{
		bankAccDoc{primitive.NewObjectID(),adaezeID,"GTBank","058","0123456789","ADAEZE OKONKWO",true,daysAgo(180)},
		bankAccDoc{primitive.NewObjectID(),adaezeID,"Access Bank","044","9876543210","ADAEZE OKONKWO",false,daysAgo(90)},
		bankAccDoc{primitive.NewObjectID(),tundeID,"Zenith Bank","057","1122334455","BABATUNDE FASHOLA",true,daysAgo(365)},
		bankAccDoc{primitive.NewObjectID(),emekaID,"First Bank","011","5544332211","CHUKWUEMEKA NWOSU",true,daysAgo(120)},
	}
	_, _ = db.Collection("bank_accounts").InsertMany(ctx, bankAccDocs)
	fmt.Printf("   ✅  %d bank accounts inserted\n\n", len(bankAccDocs))

	// ── Wire Transfers ─────────────────────────────────────────────
	fmt.Println("💸  Seeding wire transfers…")
	type wireDoc struct {
		ID            primitive.ObjectID `bson:"_id,omitempty"`
		UserID        primitive.ObjectID `bson:"userId"`
		BankName      string             `bson:"bankName"`
		AccountNumber string             `bson:"accountNumber"`
		AccountName   string             `bson:"accountName"`
		Amount        float64            `bson:"amount"`
		Fee           float64            `bson:"fee"`
		Narration     string             `bson:"narration"`
		Reference     string             `bson:"reference"`
		Status        string             `bson:"status"`
		CreatedAt     time.Time          `bson:"createdAt"`
	}
	wireDocs := []interface{}{
		wireDoc{primitive.NewObjectID(),adaezeID,"GTBank","0123456789","MAMA OKONKWO",120000,50,"Monthly upkeep for mum","WIR-A1B2C3D4","completed",daysAgo(45)},
		wireDoc{primitive.NewObjectID(),adaezeID,"Access Bank","9988776655","ADAEZE FABRICS SUPPLIER",350000,50,"Stock purchase Q1 2026","WIR-E5F6G7H8","completed",daysAgo(20)},
		wireDoc{primitive.NewObjectID(),tundeID,"UBA","3344556677","FASHOLA PROPERTIES ESCROW",2000000,50,"Property deposit","WIR-I9J0K1L2","completed",daysAgo(10)},
	}
	_, _ = db.Collection("wire_transfers").InsertMany(ctx, wireDocs)
	fmt.Printf("   ✅  %d wire transfers inserted\n\n", len(wireDocs))

	// ── Travel Bookings ─────────────────────────────────────────────
	fmt.Println("✈️   Seeding travel bookings…")
	type travelDoc struct {
		ID         primitive.ObjectID `bson:"_id,omitempty"`
		UserID     primitive.ObjectID `bson:"userId"`
		Type       string             `bson:"type"`
		Title      string             `bson:"title"`
		Provider   string             `bson:"provider"`
		From       string             `bson:"from"`
		To         string             `bson:"to"`
		DepartDate time.Time          `bson:"departDate"`
		Passengers int                `bson:"passengers"`
		Amount     float64            `bson:"amount"`
		Reference  string             `bson:"reference"`
		Status     string             `bson:"status"`
		SeatInfo   string             `bson:"seatInfo"`
		CreatedAt  time.Time          `bson:"createdAt"`
	}
	travelDocs := []interface{}{
		travelDoc{primitive.NewObjectID(),adaezeID,"flight","LOS → ABV","Air Peace","LOS","ABV",daysFrom(10),1,35000,"FLT-XK92AB","active","C14",daysAgo(2)},
		travelDoc{primitive.NewObjectID(),tundeID,"hotel","Transcorp Hilton — Abuja (3 nights)","Transcorp Hilton","Abuja","Abuja",daysFrom(10),1,285000,"HTL-PQ73RS","active","Room 512",daysAgo(2)},
		travelDoc{primitive.NewObjectID(),adaezeID,"flight","LOS → PHC","Ibom Air","LOS","PHC",daysAgo(30),2,76000,"FLT-YZ44CD","used","B7, B8",daysAgo(35)},
	}
	_, _ = db.Collection("travel_bookings").InsertMany(ctx, travelDocs)
	fmt.Printf("   ✅  %d travel bookings inserted\n\n", len(travelDocs))

// ═══════════════════════════════════════════════════════════════
	// BATCH 2 SEED DATA
	// ═══════════════════════════════════════════════════════════════

	// ── BNPL Plans ────────────────────────────────────────────────
	fmt.Println("🛒  Seeding BNPL plans…")
	type bnplInstallDoc struct {
		Number  int       `bson:"number"`
		Amount  float64   `bson:"amount"`
		DueDate time.Time `bson:"dueDate"`
		Paid    bool      `bson:"paid"`
	}
	type bnplPlanDoc struct {
		ID           primitive.ObjectID `bson:"_id,omitempty"`
		UserID       primitive.ObjectID `bson:"userId"`
		Merchant     string             `bson:"merchant"`
		MerchantLogo string             `bson:"merchantLogo"`
		Description  string             `bson:"description"`
		TotalAmount  float64            `bson:"totalAmount"`
		AmountPaid   float64            `bson:"amountPaid"`
		Installments []bnplInstallDoc    `bson:"installments"`
		Frequency    string             `bson:"frequency"`
		Status       string             `bson:"status"`
		InterestRate float64            `bson:"interestRate"`
		CreatedAt    time.Time          `bson:"createdAt"`
		UpdatedAt    time.Time          `bson:"updatedAt"`
	}
	bnplDocs := []interface{}{
		bnplPlanDoc{
			ID:primitive.NewObjectID(),UserID:adaezeID,
			Merchant:"Jumia",MerchantLogo:"🛒",Description:"Samsung Galaxy S24 Ultra 256GB",
			TotalAmount:250000,AmountPaid:83333,Frequency:"monthly",Status:"active",InterestRate:0,
			Installments:[]bnplInstallDoc{
				{1,83333,daysAgo(30),true},
				{2,83333,daysFrom(0),false},
				{3,83334,daysFrom(30),false},
			},
			CreatedAt:daysAgo(30),UpdatedAt:time.Now(),
		},
		bnplPlanDoc{
			ID:primitive.NewObjectID(),UserID:tundeID,
			Merchant:"SLOT Nigeria",MerchantLogo:"📱",Description:"MacBook Pro M3 14-inch",
			TotalAmount:800000,AmountPaid:800000,Frequency:"monthly",Status:"completed",InterestRate:0,
			Installments:[]bnplInstallDoc{
				{1,200000,daysAgo(90),true},{2,200000,daysAgo(60),true},
				{3,200000,daysAgo(30),true},{4,200000,daysAgo(1),true},
			},
			CreatedAt:daysAgo(90),UpdatedAt:daysAgo(1),
		},
	}
	_, _ = db.Collection("bnpl_plans").InsertMany(ctx, bnplDocs)
	fmt.Printf("   ✅  %d BNPL plans inserted\n\n", len(bnplDocs))

	// ── Merchant Profiles ─────────────────────────────────────────
	fmt.Println("🏪  Seeding merchant profiles…")
	type merchantProfileDoc struct {
		ID               primitive.ObjectID `bson:"_id,omitempty"`
		UserID           primitive.ObjectID `bson:"userId"`
		BusinessName     string             `bson:"businessName"`
		Category         string             `bson:"category"`
		Description      string             `bson:"description"`
		QRCode           string             `bson:"qrCode"`
		AccountNumber    string             `bson:"accountNumber"`
		TotalReceived    float64            `bson:"totalReceived"`
		TotalTransactions int              `bson:"totalTransactions"`
		IsVerified       bool               `bson:"isVerified"`
		CreatedAt        time.Time          `bson:"createdAt"`
		UpdatedAt        time.Time          `bson:"updatedAt"`
	}
	merchantProfiles := []interface{}{
		merchantProfileDoc{primitive.NewObjectID(),adaezeID,"Adaeze Fabrics & Fashion","retail","Premium Ankara and Aso-oke fabrics","opay://pay/adaeze-fabrics-001","0123456789",125000,8,true,daysAgo(90),time.Now()},
		merchantProfileDoc{primitive.NewObjectID(),tundeID,"Fashola Properties Ltd","services","Real estate consultancy and property management","opay://pay/fashola-prop-001","0987654321",850000,12,true,daysAgo(60),time.Now()},
	}
	_, _ = db.Collection("merchant_profiles").InsertMany(ctx, merchantProfiles)
	fmt.Printf("   ✅  %d merchant profiles inserted\n\n", len(merchantProfiles))

	// ── Pension Plans ──────────────────────────────────────────────
	fmt.Println("🏦  Seeding pension plans…")
	type pensionDoc struct {
		ID                      primitive.ObjectID `bson:"_id,omitempty"`
		UserID                  primitive.ObjectID `bson:"userId"`
		CurrentAge              int                `bson:"currentAge"`
		RetirementAge           int                `bson:"retirementAge"`
		CurrentBalance          float64            `bson:"currentBalance"`
		MonthlyContribution     float64            `bson:"monthlyContribution"`
		EmployerMatchPct        float64            `bson:"employerMatchPct"`
		ExpectedReturn          float64            `bson:"expectedReturn"`
		ProjectedBalance        float64            `bson:"projectedBalance"`
		MonthlyRetirementIncome float64            `bson:"monthlyRetirementIncome"`
		YearsToRetirement       int                `bson:"yearsToRetirement"`
		CreatedAt               time.Time          `bson:"createdAt"`
		UpdatedAt               time.Time          `bson:"updatedAt"`
	}
	pensionDocs := []interface{}{
		pensionDoc{primitive.NewObjectID(),adaezeID,32,60,500000,25000,50,10,18500000,61667,28,daysAgo(180),time.Now()},
		pensionDoc{primitive.NewObjectID(),tundeID,45,65,5000000,100000,100,12,52000000,173333,20,daysAgo(365),time.Now()},
		pensionDoc{primitive.NewObjectID(),emekaID,28,60,150000,15000,50,10,12800000,42667,32,daysAgo(60),time.Now()},
	}
	_, _ = db.Collection("pension_plans").InsertMany(ctx, pensionDocs)
	fmt.Printf("   ✅  %d pension plans inserted\n\n", len(pensionDocs))

// ═══════════════════════════════════════════════════════════════
	// 17. CREDIT SCORES (per seeded user)
	// ═══════════════════════════════════════════════════════════════
	fmt.Println("📊  Seeding credit scores…")

	type csDoc struct {
		ID          primitive.ObjectID `bson:"_id,omitempty"`
		UserID      primitive.ObjectID `bson:"userId"`
		Score       int                `bson:"score"`
		Tier        string             `bson:"tier"`
		LastUpdated time.Time          `bson:"lastUpdated"`
		CreatedAt   time.Time          `bson:"createdAt"`
	}

	csUsers := []struct{ id primitive.ObjectID; score int; tier string }{
		{adaezeID,  742, "good"},
		{emekaID,   698, "fair"},
		{fatimahID, 721, "good"},
		{seunID,    580, "fair"},
		{tundeID,   798, "excellent"},
		{amaraID,   651, "fair"},
	}
	var csDocs []interface{}
	for _, u := range csUsers {
		csDocs = append(csDocs, csDoc{ID:primitive.NewObjectID(),UserID:u.id,Score:u.score,Tier:u.tier,LastUpdated:time.Now(),CreatedAt:time.Now()})
	}
	_, _ = db.Collection("credit_scores").InsertMany(ctx, csDocs)
	fmt.Printf("   ✅  %d credit scores inserted\n\n", len(csDocs))

	// ═══════════════════════════════════════════════════════════════
	// 18. SUBSCRIPTIONS (for adaeze + tunde)
	// ═══════════════════════════════════════════════════════════════
	fmt.Println("📱  Seeding subscriptions…")

	type subDoc struct {
		ID              primitive.ObjectID `bson:"_id,omitempty"`
		UserID          primitive.ObjectID `bson:"userId"`
		Name            string             `bson:"name"`
		Logo            string             `bson:"logo"`
		Color           string             `bson:"color"`
		Category        string             `bson:"category"`
		Amount          float64            `bson:"amount"`
		Currency        string             `bson:"currency"`
		Frequency       string             `bson:"frequency"`
		NextBillingDate time.Time          `bson:"nextBillingDate"`
		Status          string             `bson:"status"`
		CardLast4       string             `bson:"cardLast4"`
		StartedAt       time.Time          `bson:"startedAt"`
		CreatedAt       time.Time          `bson:"createdAt"`
		UpdatedAt       time.Time          `bson:"updatedAt"`
	}

	subsData := []subDoc{
		{primitive.NewObjectID(),adaezeID,"Netflix","🎬","#ef4444","Entertainment",4000,"NGN","monthly",daysFrom(8),"active","5670",daysAgo(90),daysAgo(90),time.Now()},
		{primitive.NewObjectID(),adaezeID,"Spotify","🎵","#22c55e","Entertainment",1500,"NGN","monthly",daysFrom(3),"active","5670",daysAgo(60),daysAgo(60),time.Now()},
		{primitive.NewObjectID(),adaezeID,"DStv Compact+","📺","#1e40af","Entertainment",7900,"NGN","monthly",daysFrom(5),"active","5670",daysAgo(30),daysAgo(30),time.Now()},
		{primitive.NewObjectID(),adaezeID,"Microsoft 365","💼","#2563eb","Productivity",3500,"NGN","monthly",daysFrom(15),"active","9432",daysAgo(120),daysAgo(120),time.Now()},
		{primitive.NewObjectID(),tundeID,"Netflix","🎬","#ef4444","Entertainment",4000,"NGN","monthly",daysFrom(12),"active","0123",daysAgo(180),daysAgo(180),time.Now()},
		{primitive.NewObjectID(),tundeID,"LinkedIn Premium","💼","#0a66c2","Professional",12000,"NGN","monthly",daysFrom(6),"paused","0123",daysAgo(200),daysAgo(200),time.Now()},
	}
	var subDocs []interface{}
	for _, s := range subsData { subDocs = append(subDocs, s) }
	_, _ = db.Collection("subscriptions").InsertMany(ctx, subDocs)
	fmt.Printf("   ✅  %d subscriptions inserted\n\n", len(subDocs))

	// ═══════════════════════════════════════════════════════════════
	// 19. REMITTANCE RECIPIENTS (for adaeze + tunde)
	// ═══════════════════════════════════════════════════════════════
	fmt.Println("🌍  Seeding remittance recipients…")

	type remRecDoc struct {
		ID            primitive.ObjectID `bson:"_id,omitempty"`
		OwnerID       primitive.ObjectID `bson:"ownerId"`
		Name          string             `bson:"name"`
		Country       string             `bson:"country"`
		Flag          string             `bson:"flag"`
		Bank          string             `bson:"bank"`
		AccountNumber string             `bson:"accountNumber"`
		Currency      string             `bson:"currency"`
		IsFavorite    bool               `bson:"isFavorite"`
		CreatedAt     time.Time          `bson:"createdAt"`
	}

	remRecs := []remRecDoc{
		{primitive.NewObjectID(),adaezeID,"James Osei","UK","🇬🇧","Barclays Bank","12345678","GBP",true,daysAgo(40)},
		{primitive.NewObjectID(),adaezeID,"Kofi Mensah","Ghana","🇬🇭","Ecobank Ghana","9876543210","GHS",true,daysAgo(60)},
		{primitive.NewObjectID(),adaezeID,"Linda Eze","Canada","🇨🇦","TD Bank Canada","5566778899","CAD",false,daysAgo(20)},
		{primitive.NewObjectID(),tundeID,"Ahmed Al-Farsi","UAE","🇦🇪","Emirates NBD","0011223344","AED",true,daysAgo(15)},
		{primitive.NewObjectID(),tundeID,"Sarah Wilson","USA","🇺🇸","Chase Bank","1234567890","USD",true,daysAgo(30)},
	}
	var remRecDocs []interface{}
	for _, r := range remRecs { remRecDocs = append(remRecDocs, r) }
	_, _ = db.Collection("remittance_recipients").InsertMany(ctx, remRecDocs)
	fmt.Printf("   ✅  %d remittance recipients inserted\n\n", len(remRecDocs))

	// ═══════════════════════════════════════════════════════════════
	// 20. SPLIT PAY (adaeze's group splits)
	// ═══════════════════════════════════════════════════════════════
	fmt.Println("✂️   Seeding split payments…")

	type splitPartDoc struct {
		UserID      string     `bson:"userId"`
		Name        string     `bson:"name"`
		Email       string     `bson:"email"`
		AvatarColor string     `bson:"avatarColor"`
		Initials    string     `bson:"initials"`
		Amount      float64    `bson:"amount"`
		Paid        bool       `bson:"paid"`
		PaidAt      *time.Time `bson:"paidAt,omitempty"`
	}
	type splitDoc struct {
		ID           primitive.ObjectID `bson:"_id,omitempty"`
		CreatorID    primitive.ObjectID `bson:"creatorId"`
		Title        string             `bson:"title"`
		Description  string             `bson:"description"`
		TotalAmount  float64            `bson:"totalAmount"`
		CreatedBy    string             `bson:"createdBy"`
		Participants []splitPartDoc     `bson:"participants"`
		Status       string             `bson:"status"`
		CreatedAt    time.Time          `bson:"createdAt"`
		UpdatedAt    time.Time          `bson:"updatedAt"`
	}

	paidAt80  := daysAgo(78)
	paidAt79  := daysAgo(79)

	splitDocs := []interface{}{
		splitDoc{
			ID:primitive.NewObjectID(),CreatorID:adaezeID,
			Title:"Lagos-Abuja Trip — Fuel",Description:"Group road trip fuel for 5 people",TotalAmount:45000,
			CreatedBy:"Adaeze Okonkwo",Status:"partial",CreatedAt:daysAgo(80),UpdatedAt:time.Now(),
			Participants:[]splitPartDoc{
				{emekaID.Hex(),"Chukwuemeka Nwosu","emeka@opay.ng","#16a34a","CN",9000,true,&paidAt80},
				{fatimahID.Hex(),"Fatimah Abdullahi","fatimah@opay.ng","#3b82f6","FA",9000,true,&paidAt79},
				{seunID.Hex(),"Oluwaseun Adeyemi","seun@opay.ng","#f59e0b","OA",9000,false,nil},
				{tundeID.Hex(),"Babatunde Fashola","tunde@opay.ng","#8b5cf6","BF",9000,false,nil},
			},
		},
		splitDoc{
			ID:primitive.NewObjectID(),CreatorID:tundeID,
			Title:"Owambe Dinner 🎉",Description:"End-of-year celebration — Yellow Chilli Restaurant",TotalAmount:120000,
			CreatedBy:"Babatunde Fashola",Status:"complete",CreatedAt:daysAgo(15),UpdatedAt:daysAgo(12),
			Participants:[]splitPartDoc{
				{adaezeID.Hex(),"Adaeze Okonkwo","adaeze@opay.ng","#16a34a","AO",40000,true,&paidAt80},
				{amaraID.Hex(),"Amara Osei","amara@opay.ng","#ec4899","AO",40000,true,&paidAt79},
			},
		},
	}
	_, _ = db.Collection("splits").InsertMany(ctx, splitDocs)
	fmt.Printf("   ✅  2 split payments inserted\n\n")

// ═══════════════════════════════════════════════════════════════
	// 17. INDEXES
	// ═══════════════════════════════════════════════════════════════
	fmt.Println("📑  Creating indexes…")

	idxMap := map[string][]bson.D{
		"savings_plans":      {bson.D{{Key: "userId", Value: 1}}},
		"scheduled_payments": {bson.D{{Key: "userId", Value: 1}}, bson.D{{Key: "nextRunDate", Value: 1}}},
		"notifications":      {bson.D{{Key: "userId", Value: 1}, {Key: "createdAt", Value: -1}}},
		"budgets":            {bson.D{{Key: "userId", Value: 1}}},
		"contacts":           {bson.D{{Key: "ownerId", Value: 1}}},
		"exchange_transactions": {bson.D{{Key: "userId", Value: 1}, {Key: "createdAt", Value: -1}}},
		"insurances":         {bson.D{{Key: "userId", Value: 1}}},
		"cashback_earned":    {bson.D{{Key: "userId", Value: 1}}},
		"credit_scores":       {bson.D{{Key: "userId", Value: 1}}},
		"subscriptions":       {bson.D{{Key: "userId", Value: 1}}},
		"remittance_recipients":{bson.D{{Key: "ownerId", Value: 1}}},
		"remittance_transactions":{bson.D{{Key: "userId", Value: 1}}},
		"splits":              {bson.D{{Key: "creatorId", Value: 1}}},
		"gift_cards":          {bson.D{{Key: "userId", Value: 1}}},
		"bnpl_plans":           {bson.D{{Key: "userId", Value: 1}}},
		"merchant_profiles":    {bson.D{{Key: "userId", Value: 1}}},
		"merchant_transactions":{bson.D{{Key: "merchantId", Value: 1}, {Key: "createdAt", Value: -1}}},
		"login_devices":        {bson.D{{Key: "userId", Value: 1}}},
		"security_alerts":      {bson.D{{Key: "userId", Value: 1}, {Key: "createdAt", Value: -1}}},
		"pension_plans":        {bson.D{{Key: "userId", Value: 1}}},
		"bank_accounts":        {bson.D{{Key: "userId", Value: 1}}},
		"wire_transfers":       {bson.D{{Key: "userId", Value: 1}, {Key: "createdAt", Value: -1}}},
		"tax_years":            {bson.D{{Key: "userId", Value: 1}, {Key: "year", Value: -1}}},
		"user_challenges":      {bson.D{{Key: "userId", Value: 1}}},
		"travel_bookings":      {bson.D{{Key: "userId", Value: 1}, {Key: "departDate", Value: 1}}},
		"social_activities":    {bson.D{{Key: "isPublic", Value: 1}, {Key: "createdAt", Value: -1}}},
		"escrow_contracts":     {bson.D{{Key: "buyerId", Value: 1}}},
		"payment_links":        {bson.D{{Key: "userId", Value: 1}}},
		"portfolio_holdings":   {bson.D{{Key: "userId", Value: 1}}},
		"family_accounts":      {bson.D{{Key: "ownerId", Value: 1}}},
		"airtime_purchases":    {bson.D{{Key: "userId", Value: 1}, {Key: "createdAt", Value: -1}}},
		"bill_payments":        {bson.D{{Key: "userId", Value: 1}, {Key: "createdAt", Value: -1}}},
		"alert_rules":          {bson.D{{Key: "userId", Value: 1}}},
		"crypto_wallets":       {bson.D{{Key: "userId", Value: 1}}},
		"crypto_transactions":  {bson.D{{Key: "userId", Value: 1}, {Key: "createdAt", Value: -1}}},
		"support_tickets":    {bson.D{{Key: "userId", Value: 1}}},
	}

	for col, keys := range idxMap {
		for _, k := range keys {
			_, _ = db.Collection(col).Indexes().CreateOne(ctx, mongo.IndexModel{Keys: k})
		}
	}
	fmt.Printf("   ✅  Indexes created/verified\n\n")

	// ─── SUMMARY ──────────────────────────────────────────────────
	fmt.Println(strings.Repeat("═", 60))
	fmt.Println("🎉  SEED COMPLETE!")
	fmt.Println(strings.Repeat("═", 60))
	fmt.Printf("  Database  : %s\n", config.AppConfig.MongoDB)
	fmt.Printf("  Users     : %d  (password: Password@123)\n", len(userDefs))
	fmt.Println()
	fmt.Println("     Email                  Password")
	fmt.Println("     ─────────────────────  ───────────")
	for _, u := range userDefs {
		marker := ""
		if u.email == "adaeze@opay.ng" {
			marker = "  ← MAIN USER (most data)"
		}
		fmt.Printf("     %-22s  Password@123%s\n", u.email, marker)
	}
	fmt.Printf("\n  🔗 Referral chain: adaeze → emeka, fatimah → ngozi; fatimah → tunde\n")
	fmt.Printf("  💰 Wallets range: ₦15,200 (ngozi) to ₦923,100 (tunde)\n")
	fmt.Printf("  📊 Collections seeded:\n")
	fmt.Printf("       users(%d)  wallets(%d)  transactions(%d)  cards(%d)\n", len(userDefs), len(walletDefs), len(txDocs), len(cardDocs))
	fmt.Printf("       investments(%d)  loans(%d)  referrals(%d)  exchange(%d)\n", len(invDocs), len(loanDocs), len(refDocs), len(fxDocs))
	fmt.Printf("       insurance(%d)  savings(%d)  scheduled(%d)  notifications(%d)\n", len(insDocs), len(savDocs), len(schedDocs), len(notifDocs))
	fmt.Printf("       budgets(%d)  contacts(%d)  support_tickets(%d)  cashback(%d)\n", len(budgetDocs), len(contactDocs), len(ticketDocs), len(cbDocs))
	fmt.Println(strings.Repeat("═", 60))
}

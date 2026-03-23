package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/opay/backend/controllers"
	"github.com/opay/backend/middleware"
)

func Setup(app *fiber.App) {
	api := app.Group("/api")

	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": "opay-api", "version": "10.0"})
	})

	// ── Auth ──────────────────────────────────────────────────────────────────
	auth := api.Group("/auth")
	auth.Post("/register",  controllers.Register)
	auth.Post("/login",     controllers.Login)
	auth.Post("/refresh",   controllers.RefreshToken)
	auth.Post("/logout",    middleware.AuthRequired, controllers.Logout)
	auth.Get("/me",         middleware.AuthRequired, controllers.GetMe)

	// ── Wallet ────────────────────────────────────────────────────────────────
	wallet := api.Group("/wallet", middleware.AuthRequired)
	wallet.Get("/balance",        controllers.GetBalance)
	wallet.Post("/fund",          controllers.FundWallet)
	wallet.Post("/transfer/opay", controllers.TransferToOpay)
	wallet.Get("/transactions",   controllers.GetTransactions)

	// ── Cards ─────────────────────────────────────────────────────────────────
	cards := api.Group("/cards", middleware.AuthRequired)
	cards.Get("/",  controllers.GetCards)
	cards.Post("/", controllers.CreateCard)

	// ── Investments ───────────────────────────────────────────────────────────
	inv := api.Group("/investments", middleware.AuthRequired)
	inv.Get("/",       controllers.GetInvestments)
	inv.Post("/",      controllers.CreateInvestment)
	inv.Delete("/:id", controllers.LiquidateInvestment)

	// ── Loans ─────────────────────────────────────────────────────────────────
	loans := api.Group("/loans", middleware.AuthRequired)
	loans.Get("/",           controllers.GetLoans)
	loans.Post("/",          controllers.ApplyLoan)
	loans.Post("/:id/repay", controllers.RepayLoan)

	// ── Exchange ──────────────────────────────────────────────────────────────
	fx := api.Group("/exchange", middleware.AuthRequired)
	fx.Get("/rates",   controllers.GetExchangeRates)
	fx.Post("/",       controllers.ExchangeCurrency)
	fx.Get("/history", controllers.GetExchangeHistory)

	// ── Insurance ─────────────────────────────────────────────────────────────
	ins := api.Group("/insurance", middleware.AuthRequired)
	ins.Get("/",       controllers.GetInsurances)
	ins.Post("/",      controllers.CreateInsurance)
	ins.Delete("/:id", controllers.CancelInsurance)

	// ── Referrals ─────────────────────────────────────────────────────────────
	referrals := api.Group("/referrals", middleware.AuthRequired)
	referrals.Get("/", controllers.GetReferrals)

	// ── Credit Score (NEW v6) ─────────────────────────────────────────────────
	cs := api.Group("/credit-score", middleware.AuthRequired)
	cs.Get("/",            controllers.GetCreditScore)
	cs.Post("/simulate",   controllers.SimulateCreditBoost)

	// ── Gift Cards (NEW v6) ───────────────────────────────────────────────────
	gc := api.Group("/gift-cards", middleware.AuthRequired)
	gc.Get("/",           controllers.GetGiftCards)
	gc.Post("/",          controllers.PurchaseGiftCard)
	gc.Post("/:id/use",   controllers.UseGiftCard)

	// ── Split Pay (NEW v6) ────────────────────────────────────────────────────
	sp := api.Group("/split-pay", middleware.AuthRequired)
	sp.Get("/",                   controllers.GetSplits)
	sp.Post("/",                  controllers.CreateSplit)
	sp.Post("/:id/mark-paid",     controllers.MarkParticipantPaid)
	sp.Delete("/:id",             controllers.CancelSplit)

	// ── Remittance (NEW v6) ───────────────────────────────────────────────────
	rem := api.Group("/remittance", middleware.AuthRequired)
	rem.Get("/rates",                 controllers.GetRemittanceRates)
	rem.Get("/recipients",            controllers.GetRecipients)
	rem.Post("/recipients",           controllers.AddRecipient)
	rem.Patch("/recipients/:id/favourite", controllers.ToggleFavoriteRecipient)
	rem.Get("/history",               controllers.GetRemittanceHistory)
	rem.Post("/send",                 controllers.SendRemittance)

	// ── Subscriptions (NEW v6) ────────────────────────────────────────────────
	subs := api.Group("/subscriptions", middleware.AuthRequired)
	subs.Get("/",          controllers.GetSubscriptions)
	subs.Get("/stats",     controllers.GetSubscriptionStats)
	subs.Post("/",         controllers.AddSubscription)
	subs.Patch("/:id/toggle", controllers.ToggleSubscription)
	subs.Delete("/:id",    controllers.CancelSubscription)


	// ── Net Worth (NEW v7) ───────────────────────────────────────────────────────
	nw := api.Group("/net-worth", middleware.AuthRequired)
	nw.Get("/", controllers.GetNetWorth)

	// ── Pay Later / BNPL (NEW v7) ────────────────────────────────────────────────
	bnpl := api.Group("/pay-later", middleware.AuthRequired)
	bnpl.Get("/",        controllers.GetBNPLPlans)
	bnpl.Post("/",       controllers.CreateBNPLPlan)
	bnpl.Post("/:id/pay",controllers.PayBNPLInstallment)

	// ── Merchant (NEW v7) ────────────────────────────────────────────────────────
	merch := api.Group("/merchant", middleware.AuthRequired)
	merch.Get("/profile",      controllers.GetMerchantProfile)
	merch.Post("/profile",     controllers.CreateMerchantProfile)
	merch.Get("/transactions", controllers.GetMerchantTransactions)
	merch.Post("/receive",     controllers.ReceiveMerchantPayment)

	// ── Security Center (NEW v7) ─────────────────────────────────────────────────
	sec := api.Group("/security", middleware.AuthRequired)
	sec.Get("/overview",               controllers.GetSecurityOverviewSeeded)
	sec.Post("/devices/:id/block",     controllers.BlockDevice)
	sec.Patch("/alerts/:id/read",      controllers.MarkAlertRead)
	sec.Post("/alerts/read-all",       controllers.MarkAllAlertsRead)
	sec.Post("/2fa/toggle",            controllers.Toggle2FA)

	// ── Pension Planner (NEW v7) ─────────────────────────────────────────────────
	pen := api.Group("/pension", middleware.AuthRequired)
	pen.Get("/",             controllers.GetPensionPlan)
	pen.Put("/",             controllers.UpdatePensionPlan)
	pen.Post("/contribute",  controllers.ContributePension)


	// ── Referral Center (NEW v8) ─────────────────────────────────────────────────
	rc := api.Group("/referral-center", middleware.AuthRequired)
	rc.Get("/",       controllers.GetReferralCenter)
	rc.Get("/share",  controllers.GenerateShareLink)

	// ── Wire Transfer (NEW v8) ───────────────────────────────────────────────────
	wt := api.Group("/wire-transfer", middleware.AuthRequired)
	wt.Get("/banks",    controllers.GetBankAccounts)
	wt.Post("/banks",   controllers.AddBankAccount)
	wt.Get("/history",  controllers.GetWireHistory)
	wt.Post("/send",    controllers.SendWireTransfer)

	// ── Tax Center (NEW v8) ──────────────────────────────────────────────────────
	tax := api.Group("/tax", middleware.AuthRequired)
	tax.Get("/",             controllers.GetTaxSummary)
	tax.Post("/compute",     controllers.ComputeTax)
	tax.Post("/documents",   controllers.GenerateTaxDoc)

	// ── Budget Challenges (NEW v8) ───────────────────────────────────────────────
	chal := api.Group("/challenges", middleware.AuthRequired)
	chal.Get("/",               controllers.GetChallenges)
	chal.Post("/join",          controllers.JoinChallenge)
	chal.Post("/:id/progress",  controllers.UpdateChallengeProgress)
	chal.Delete("/:id",         controllers.AbandonChallenge)

	// ── Travel & Lifestyle (NEW v8) ──────────────────────────────────────────────
	trv := api.Group("/travel", middleware.AuthRequired)
	trv.Get("/",              controllers.GetTravelBookings)
	trv.Get("/flights",       controllers.GetFlightPrices)
	trv.Post("/flights/book", controllers.BookFlight)
	trv.Post("/hotels/book",  controllers.BookHotel)


	// ── Social Feed (NEW v9) ─────────────────────────────────────────────────────
	soc := api.Group("/social", middleware.AuthRequired)
	soc.Get("/feed",          controllers.GetFeed)
	soc.Get("/mine",          controllers.GetMyPosts)
	soc.Post("/posts",        controllers.CreatePost)
	soc.Post("/posts/:id/react", controllers.ReactToPost)

	// ── Escrow (NEW v9) ──────────────────────────────────────────────────────────
	esc := api.Group("/escrow", middleware.AuthRequired)
	esc.Get("/",              controllers.GetEscrows)
	esc.Post("/",             controllers.CreateEscrow)
	esc.Post("/:id/release",  controllers.ReleaseMilestone)
	esc.Delete("/:id",        controllers.CancelEscrow)

	// ── Payment Links (NEW v9) ───────────────────────────────────────────────────
	pl := api.Group("/payment-links", middleware.AuthRequired)
	pl.Get("/",               controllers.GetPaymentLinks)
	pl.Post("/",              controllers.CreatePaymentLink)
	pl.Patch("/:id/toggle",   controllers.TogglePaymentLink)
	pl.Delete("/:id",         controllers.DeletePaymentLink)
	pl.Post("/:id/simulate",  controllers.SimulatePayment)

	// ── Portfolio (NEW v9) ───────────────────────────────────────────────────────
	port := api.Group("/portfolio", middleware.AuthRequired)
	port.Get("/",             controllers.GetPortfolio)
	port.Post("/buy",         controllers.BuyAsset)
	port.Post("/:id/sell",    controllers.SellAsset)

	// ── Family Account (NEW v9) ──────────────────────────────────────────────────
	fam := api.Group("/family", middleware.AuthRequired)
	fam.Get("/",                     controllers.GetFamilyAccount)
	fam.Post("/",                    controllers.CreateFamilyAccount)
	fam.Post("/invite",              controllers.InviteMember)
	fam.Post("/fund",                controllers.FundFamily)
	fam.Patch("/members/:email/limit", controllers.SetSpendLimit)


	// ── Airtime & Data (NEW v10) ─────────────────────────────────────────────────
	air := api.Group("/airtime", middleware.AuthRequired)
	air.Get("/plans",    controllers.GetDataPlans)
	air.Post("/buy",     controllers.BuyAirtime)
	air.Get("/history",  controllers.GetAirtimeHistory)

	// ── Bill Payments (NEW v10) ──────────────────────────────────────────────────
	api.Get("/bill-providers",  controllers.GetBillProviders)
	api.Get("/bills-history",   middleware.AuthRequired, controllers.GetBillHistory)
	api.Post("/bills/pay",      middleware.AuthRequired, controllers.PayBill)

	// ── Alert Rules (NEW v10) ────────────────────────────────────────────────────
	alrt := api.Group("/alerts", middleware.AuthRequired)
	alrt.Get("/",              controllers.GetAlertRules)
	alrt.Post("/",             controllers.CreateAlertRule)
	alrt.Patch("/:id/toggle",  controllers.ToggleAlertRule)
	alrt.Delete("/:id",        controllers.DeleteAlertRule)

	// ── Crypto Wallet (NEW v10) ──────────────────────────────────────────────────
	cryp := api.Group("/crypto", middleware.AuthRequired)
	cryp.Get("/wallet",    controllers.GetCryptoWallet)
	cryp.Post("/buy",      controllers.BuyCrypto)
	cryp.Post("/sell",     controllers.SellCrypto)
	cryp.Post("/convert",  controllers.ConvertCrypto)

	// ── 404 ───────────────────────────────────────────────────────────────────
	app.Use(func(c *fiber.Ctx) error {
		return c.Status(404).JSON(fiber.Map{"success": false, "message": "route not found"})
	})
}

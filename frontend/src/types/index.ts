// ── User ──────────────────────────────────────────────────────────────────────
export interface User {
  id:string; firstName:string; lastName:string; email:string
  phone?:string; avatarUrl?:string; referralCode:string
  isVerified:boolean; kycLevel:0|1|2|3; pin?:boolean
  twoFactorEnabled?:boolean; tier?:'basic'|'premium'|'elite'; createdAt:string
}
// ── Wallet ────────────────────────────────────────────────────────────────────
export interface Wallet { id:string; userId:string; balance:number; currency:string; createdAt:string }
// ── Transactions ──────────────────────────────────────────────────────────────
export type TransactionType='fund'|'transfer'|'withdraw'|'receive'|'referral'|'bill'|'savings'|'investment'|'loan_disbursement'|'loan_repayment'|'p2p_send'|'p2p_receive'|'exchange'|'insurance'|'airtime'|'data'|'electricity'|'cashback'
export type TransactionStatus='pending'|'success'|'failed'|'reversed'|'processing'
export interface Transaction {
  id:string; userId:string; type:TransactionType; amount:number; fee:number
  balanceBefore:number; balanceAfter:number; status:TransactionStatus
  reference:string; description:string; counterpartyName?:string
  counterpartyId?:string; metadata?:Record<string,string>; category?:string
  createdAt:string; updatedAt:string
}
// ── Cards ─────────────────────────────────────────────────────────────────────
export type CardType='virtual'|'physical'; export type CardStatus='active'|'frozen'|'canceled'; export type CardTheme='green'|'dark'|'gold'|'midnight'|'rose'
export interface CardPublic { id:string; type:CardType; maskedNumber:string; expiryMonth:number; expiryYear:number; cardHolder:string; network:string; status:CardStatus; color:string; theme?:CardTheme; spendLimit?:number; totalSpent?:number; createdAt:string }
// ── Savings ───────────────────────────────────────────────────────────────────
export type SavingsType='fixed'|'target'|'flex'|'group'; export type SavingsStatus='active'|'completed'|'broken'|'paused'
export interface SavingsPlan { id:string; userId:string; name:string; emoji:string; type:SavingsType; targetAmount:number; currentAmount:number; interestRate:number; interestEarned:number; startDate:string; endDate?:string; status:SavingsStatus; autoSave:boolean; frequency?:'daily'|'weekly'|'monthly'; color:string; members?:string[]; createdAt:string }
// ── Investments ───────────────────────────────────────────────────────────────
export type InvestmentType='money_market'|'treasury_bill'|'fixed_income'|'mutual_fund'|'stocks'|'crypto_index'
export type InvestmentStatus='active'|'matured'|'liquidated'
export interface InvestmentPlan { id:string; userId:string; name:string; type:InvestmentType; principalAmount:number; currentValue:number; returnRate:number; returnAmount:number; returnPercent:number; tenure:number; tenureUnit:'days'|'months'|'years'; maturityDate:string; status:InvestmentStatus; createdAt:string }
// ── Loans ─────────────────────────────────────────────────────────────────────
export type LoanStatus='pending'|'approved'|'active'|'repaid'|'overdue'|'rejected'
export interface LoanProduct { id:string; name:string; description:string; minAmount:number; maxAmount:number; interestRate:number; maxTenure:number; tenureUnit:'days'|'months'; requiresKYC:number; icon:string; color:string }
export interface LoanApplication { id:string; userId:string; productId:string; amount:number; tenure:number; monthlyRepayment:number; totalRepayment:number; interestAmount:number; status:LoanStatus; disbursedAt?:string; dueDate?:string; createdAt:string }
// ── Exchange ──────────────────────────────────────────────────────────────────
export interface ExchangeRate { from:string; to:string; rate:number; updatedAt:string }
export interface ExchangeTransaction { id:string; userId:string; fromCurrency:string; toCurrency:string; fromAmount:number; toAmount:number; rate:number; fee:number; status:TransactionStatus; createdAt:string }
// ── Insurance ─────────────────────────────────────────────────────────────────
export type InsuranceType='health'|'life'|'auto'|'device'|'travel'|'home'
export type InsuranceStatus='active'|'expired'|'cancelled'|'pending'
export interface InsurancePolicy { id:string; userId:string; type:InsuranceType; name:string; provider:string; premium:number; frequency:'monthly'|'quarterly'|'annual'; coverage:number; startDate:string; endDate:string; status:InsuranceStatus; policyNumber:string; benefits:string[]; createdAt:string }
// ── Analytics ─────────────────────────────────────────────────────────────────
export interface SpendingCategory { category:string; amount:number; percentage:number; color:string; change?:number }
export interface MonthlyData { month:string; income:number; expense:number; savings?:number; investments?:number }
export interface NetWorthBreakdown { wallet:number; savings:number; investments:number; total:number; loans?:number }
export interface DailySpend { date:string; amount:number }
export interface BudgetCategory { category:string; allocated:number; spent:number; color:string }
// ── Notifications ─────────────────────────────────────────────────────────────
export type NotificationCategory='transaction'|'security'|'promo'|'system'|'loan'|'investment'|'insurance'|'cashback'
export interface Notification { id:string; userId:string; title:string; body:string; category:NotificationCategory; isRead:boolean; iconName?:string; actionUrl?:string; priority?:'low'|'medium'|'high'; createdAt:string }
// ── Contacts ──────────────────────────────────────────────────────────────────
export interface Contact { id:string; name:string; email:string; phone?:string; avatarColor:string; initials:string; isFavorite:boolean; lastTransferDate?:string; lastTransferAmount?:number; bank?:string }
// ── Support ───────────────────────────────────────────────────────────────────
export type TicketStatus='open'|'in_progress'|'resolved'|'closed'
export interface SupportTicket { id:string; subject:string; category:string; status:TicketStatus; messages:TicketMessage[]; createdAt:string }
export interface TicketMessage { id:string; sender:'user'|'agent'; body:string; createdAt:string }
// ── KYC ───────────────────────────────────────────────────────────────────────
export type KYCDocType='bvn'|'nin'|'passport'|'drivers_license'|'voters_card'
// ── Budget ────────────────────────────────────────────────────────────────────
export interface Budget { id:string; userId:string; name:string; totalBudget:number; spent:number; month:string; categories:BudgetCategory[]; createdAt:string }
// ── Cashback ──────────────────────────────────────────────────────────────────
export interface CashbackOffer { id:string; merchant:string; percentage:number; category:string; maxAmount:number; validUntil:string; logo?:string; color:string }
export interface CashbackEarned { id:string; offerId:string; amount:number; txRef:string; createdAt:string }
// ── Scheduler ─────────────────────────────────────────────────────────────────
export type ScheduledFreq='once'|'daily'|'weekly'|'monthly'
export type ScheduledType='transfer'|'bill'|'savings'
export interface ScheduledPayment { id:string; userId:string; type:ScheduledType; name:string; amount:number; recipientEmail?:string; billCategory?:string; frequency:ScheduledFreq; nextRunDate:string; lastRunDate?:string; active:boolean; createdAt:string }
// ── Credit Score ──────────────────────────────────────────────────────────────
export interface CreditFactor { label:string; score:number; maxScore:number; status:'good'|'fair'|'poor'; tip:string }
export interface CreditHistory { month:string; score:number }
// ── Gift Cards ────────────────────────────────────────────────────────────────
export type GiftCardStatus='active'|'used'|'expired'
export interface GiftCard { id:string; brand:string; logo:string; color:string; amount:number; code:string; pin:string; balance:number; status:GiftCardStatus; expiryDate:string; purchasedAt:string }
export interface GiftCardBrand { id:string; name:string; logo:string; color:string; denominations:number[]; category:string }
// ── Split Pay ─────────────────────────────────────────────────────────────────
export type SplitStatus='pending'|'partial'|'complete'|'cancelled'
export interface SplitParticipant { userId:string; name:string; email:string; avatarColor:string; initials:string; amount:number; paid:boolean; paidAt?:string }
export interface SplitRequest { id:string; title:string; totalAmount:number; description:string; createdBy:string; participants:SplitParticipant[]; status:SplitStatus; createdAt:string }
// ── Remittance ────────────────────────────────────────────────────────────────
export type RemittanceStatus='pending'|'processing'|'delivered'|'failed'|'cancelled'
export interface RemittanceRecipient { id:string; name:string; country:string; flag:string; bank:string; accountNumber:string; currency:string; isFavorite:boolean }
export interface RemittanceTransaction { id:string; recipientId:string; recipientName:string; country:string; flag:string; sendAmount:number; receiveAmount:number; sendCurrency:string; receiveCurrency:string; rate:number; fee:number; status:RemittanceStatus; reference:string; estimatedArrival:string; createdAt:string }
// ── Subscriptions ─────────────────────────────────────────────────────────────
export type SubFrequency='monthly'|'quarterly'|'annual'
export type SubStatus='active'|'paused'|'cancelled'|'trial'
export interface Subscription { id:string; name:string; logo:string; color:string; category:string; amount:number; currency:string; frequency:SubFrequency; nextBillingDate:string; status:SubStatus; cardLast4:string; startedAt:string; trialEndsAt?:string }

// ── Net Worth ─────────────────────────────────────────────────────────────────
export interface AssetItem { id:string; category:string; name:string; value:number; color:string; icon:string; change?:number; changePercent?:number }
export interface LiabilityItem { id:string; name:string; outstanding:number; original:number; interestRate:number; monthlyPayment:number; dueDate?:string }
export interface NetWorthSnapshot { date:string; total:number; assets:number; liabilities:number }

// ── Pay Later / BNPL ──────────────────────────────────────────────────────────
export type BNPLStatus='active'|'completed'|'overdue'|'cancelled'
export interface BNPLInstallment { number:number; amount:number; dueDate:string; paidDate?:string; paid:boolean }
export interface BNPLPlan { id:string; userId:string; merchant:string; merchantLogo:string; description:string; totalAmount:number; amountPaid:number; installments:BNPLInstallment[]; frequency:'weekly'|'biweekly'|'monthly'; status:BNPLStatus; interestRate:number; createdAt:string }
export interface BNPLMerchant { id:string; name:string; logo:string; color:string; category:string; maxLimit:number; interestRate:number; maxInstallments:number }

// ── Merchant ──────────────────────────────────────────────────────────────────
export type MerchantCategory='retail'|'food'|'services'|'entertainment'|'transport'|'health'
export interface MerchantProfile { id:string; userId:string; businessName:string; category:MerchantCategory; description:string; qrCode:string; accountNumber:string; bankCode:string; totalReceived:number; totalTransactions:number; isVerified:boolean; createdAt:string }
export interface MerchantTransaction { id:string; merchantId:string; amount:number; fee:number; netAmount:number; customerName:string; reference:string; status:TransactionStatus; createdAt:string }
export interface MerchantPaymentRequest { amount:number; description:string; reference:string; expiresAt?:string }

// ── Security Center ───────────────────────────────────────────────────────────
export type DeviceTrust='trusted'|'untrusted'|'blocked'
export interface LoginDevice { id:string; name:string; browser:string; os:string; ip:string; location:string; lastSeen:string; isCurrent:boolean; trust:DeviceTrust }
export interface LoginHistory { id:string; device:string; ip:string; location:string; success:boolean; timestamp:string }
export interface SecurityAlert { id:string; type:'login'|'transfer'|'pin_change'|'device'|'fraud'; title:string; description:string; severity:'low'|'medium'|'high'|'critical'; isRead:boolean; createdAt:string }

// ── Pension Planner ───────────────────────────────────────────────────────────
export interface PensionContribution { month:string; amount:number; employerMatch:number; returns:number; total:number }
export interface PensionProjection { age:number; balance:number; monthlyIncome:number }
export interface PensionPlan { id:string; userId:string; currentAge:number; retirementAge:number; currentBalance:number; monthlyContribution:number; employerMatchPct:number; expectedReturn:number; projectedBalance:number; monthlyRetirementIncome:number; yearsToRetirement:number; contributions:PensionContribution[]; createdAt:string }

// ── Referral Center ───────────────────────────────────────────────────────────
export interface ReferralEntry { id:string; refereeName:string; bonusAmount:number; status:string; joinedAt:string }
export interface ReferralMilestone { referrals:number; reward:number; bonus:string }
// ── Wire Transfer ─────────────────────────────────────────────────────────────
export interface BankAccount { id:string; bankName:string; bankCode:string; accountNumber:string; accountName:string; isDefault:boolean; createdAt:string }
export interface WireTransfer { id:string; bankName:string; accountNumber:string; accountName:string; amount:number; fee:number; narration:string; reference:string; status:string; createdAt:string }
// ── Tax Center ────────────────────────────────────────────────────────────────
export interface TaxBracket { label:string; rate:number; from:number; to:number; tax:number }
export interface TaxYearSummary { grossIncome:number; deductions:number; taxableIncome:number; taxOwed:number; taxPaid:number; balance:number }
// ── Budget Challenges ─────────────────────────────────────────────────────────
export type ChallengeStatus='active'|'completed'|'failed'|'abandoned'
export type ChallengeType='savings'|'spending'|'no_spend'|'debt'
export interface ChallengeMilestone { label:string; target:number; reward:number; achieved:boolean }
// ── Travel ────────────────────────────────────────────────────────────────────
export type TravelType='flight'|'hotel'|'bus'
export type TravelStatus='active'|'used'|'expired'|'pending'

// ── Social Feed ────────────────────────────────────────────────────────────────
export type SocialActivityType = 'send'|'receive'|'savings'|'investment'|'challenge'
export interface SocialReaction { userId:string; emoji:string }

// ── Escrow ────────────────────────────────────────────────────────────────────
export type EscrowStatus='open'|'funded'|'in_progress'|'completed'|'disputed'|'cancelled'
export type MilestoneStatus='pending'|'released'|'approved'
export interface EscrowMilestone { id:string; title:string; description:string; amount:number; status:MilestoneStatus; releasedAt?:string }

// ── Payment Links ─────────────────────────────────────────────────────────────
export type PaymentLinkStatus='active'|'inactive'|'expired'

// ── Portfolio ─────────────────────────────────────────────────────────────────
export type AssetType='stock'|'crypto'|'etf'

// ── Family Account ────────────────────────────────────────────────────────────
export type FamilyMemberRole='owner'|'admin'|'member'

// ── Airtime & Data ────────────────────────────────────────────────────────────
export type AirtimeNetwork='MTN'|'Airtel'|'Glo'|'9mobile'

// ── Bill Payments ─────────────────────────────────────────────────────────────
export type BillCategory='electricity'|'cable_tv'|'internet'|'water'|'betting'

// ── Alert Rules ───────────────────────────────────────────────────────────────
export type AlertTrigger='balance_below'|'large_debit'|'large_credit'|'loan_due'|'savings_goal'|'foreign_login'
export type AlertChannel='push'|'email'|'sms'

// ── Crypto ────────────────────────────────────────────────────────────────────
export type CryptoTxType='buy'|'sell'|'convert'|'receive'|'send_crypto'

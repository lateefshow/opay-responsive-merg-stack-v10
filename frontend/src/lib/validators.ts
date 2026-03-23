import { z } from 'zod'
export const registerSchema = z.object({ firstName:z.string().min(2).max(50),lastName:z.string().min(2).max(50),email:z.string().email(),phone:z.string().min(10).max(15).optional().or(z.literal('')),password:z.string().min(8).max(72),referredBy:z.string().optional() })
export const loginSchema = z.object({ email:z.string().email(),password:z.string().min(1,'Required') })
export const fundSchema = z.object({ amount:z.coerce.number().positive().max(10_000_000) })
export const transferSchema = z.object({ recipientEmail:z.string().email(),amount:z.coerce.number().positive(),note:z.string().max(200).optional() })
export const billSchema = z.object({ category:z.string().min(1),provider:z.string().min(1),accountRef:z.string().min(3),amount:z.coerce.number().positive() })
export const savingsSchema = z.object({ name:z.string().min(3).max(60),emoji:z.string().optional(),type:z.enum(['fixed','target','flex','group']),targetAmount:z.coerce.number().positive(),frequency:z.enum(['daily','weekly','monthly']).optional(),autoSave:z.boolean(),endDate:z.string().optional() })
export const investmentSchema = z.object({ type:z.enum(['money_market','treasury_bill','fixed_income','mutual_fund','stocks','crypto_index']),amount:z.coerce.number().min(5000,'Minimum ₦5,000'),tenure:z.coerce.number().int().positive() })
export const loanSchema = z.object({ productId:z.string().min(1),amount:z.coerce.number().positive(),tenure:z.coerce.number().int().positive(),purpose:z.string().min(10).max(200) })
export const kycSchema = z.object({ docType:z.enum(['bvn','nin','passport','drivers_license','voters_card']),docNumber:z.string().min(8).max(20) })
export const supportSchema = z.object({ subject:z.string().min(5).max(100),category:z.enum(['transaction','account','card','loan','general']),description:z.string().min(20).max(1000) })
export const exchangeSchema = z.object({ fromCurrency:z.string().min(3).max(3),toCurrency:z.string().min(3).max(3),amount:z.coerce.number().positive() })
export const insuranceSchema = z.object({ type:z.enum(['health','life','auto','device','travel','home']),plan:z.string().min(1),startDate:z.string() })
export const budgetSchema = z.object({ totalBudget:z.coerce.number().positive(),categories:z.array(z.object({ category:z.string(),allocated:z.coerce.number().min(0) })) })
export const schedulerSchema = z.object({ type:z.enum(['transfer','bill','savings']),name:z.string().min(3),amount:z.coerce.number().positive(),frequency:z.enum(['once','daily','weekly','monthly']),nextRunDate:z.string(),recipientEmail:z.string().email().optional(),billCategory:z.string().optional() })
export const settingsProfileSchema = z.object({ firstName:z.string().min(2).max(50),lastName:z.string().min(2).max(50),phone:z.string().min(10).max(15).optional().or(z.literal('')) })
export type RegisterInput=z.infer<typeof registerSchema>; export type LoginInput=z.infer<typeof loginSchema>
export type FundInput=z.infer<typeof fundSchema>; export type TransferInput=z.infer<typeof transferSchema>
export type BillInput=z.infer<typeof billSchema>; export type SavingsInput=z.infer<typeof savingsSchema>
export type InvestmentInput=z.infer<typeof investmentSchema>; export type LoanInput=z.infer<typeof loanSchema>
export type KYCInput=z.infer<typeof kycSchema>; export type SupportInput=z.infer<typeof supportSchema>
export type ExchangeInput=z.infer<typeof exchangeSchema>; export type InsuranceInput=z.infer<typeof insuranceSchema>
export type BudgetInput=z.infer<typeof budgetSchema>; export type SchedulerInput=z.infer<typeof schedulerSchema>
export type SettingsProfileInput=z.infer<typeof settingsProfileSchema>

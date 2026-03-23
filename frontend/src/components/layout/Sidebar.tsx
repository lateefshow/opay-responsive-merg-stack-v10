import { NavLink, useNavigate } from "react-router-dom";
import {
  Coins, PhoneCall, FileText, AlertOctagon, Calculator,
  QrCode, ArrowLeftRight, Landmark, Gamepad2, PiggyBank,
  Users, ChevronDown, Zap, TrendingUp, Plus, ShieldCheck,
  Banknote, Send, Shield, Activity, Calendar, DollarSign,
  Gift, Globe, Home, BarChart2, CreditCard, Star, Scissors,
  ShoppingCart, Store, UserPlus, ArrowRightLeft, Receipt,
  MapPin, Bell, User, HelpCircle, Settings, LogOut,
  Users2, Lock, Link as LinkIcon, Building as Home2,
} from "lucide-react";

import { useState } from "react";
import { cn, getInitials, formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useWalletStore } from "@/store/useWalletStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import toast from "react-hot-toast";

const MAIN_NAV = [
  { to: "/",           icon: Home,       label: "Home"      },
  { to: "/finance",    icon: BarChart2,   label: "Finance"   },
  { to: "/cards",      icon: CreditCard,  label: "Cards"     },
  { to: "/savings",    icon: PiggyBank,   label: "Savings"   },
  { to: "/investments",icon: TrendingUp,  label: "Invest"    },
  { to: "/loans",      icon: Banknote,    label: "Loans"     },
  { to: "/bills",      icon: Zap,         label: "Bills"     },
  { to: "/rewards",    icon: Gift,        label: "Rewards"   },
];

const MORE_NAV = [
  { to: "/exchange",      icon: ArrowLeftRight, label: "Exchange"       },
  { to: "/insurance",     icon: Shield,         label: "Insurance"      },
  { to: "/analytics",     icon: Activity,       label: "Analytics"      },
  { to: "/scheduler",     icon: Calendar,       label: "Scheduler"      },
  { to: "/budget",        icon: DollarSign,     label: "Budget"         },
  { to: "/cashback",      icon: Gift,           label: "Cashback"       },
  { to: "/send",          icon: Send,           label: "P2P Send"       },
  { to: "/scan",          icon: QrCode,         label: "QR Scan"        },
  { to: "/credit-score",  icon: Star,           label: "Credit Score"   },
  { to: "/gift-cards",    icon: Gift,           label: "Gift Cards"     },
  { to: "/split-pay",     icon: Scissors,       label: "Split Pay"      },
  { to: "/remittance",    icon: Globe,          label: "Remittance"     },
  { to: "/subscriptions", icon: CreditCard,     label: "Subscriptions"  },
  { to: "/net-worth",     icon: TrendingUp,     label: "Net Worth"      },
  { to: "/pay-later",     icon: ShoppingCart,   label: "Pay Later"      },
  { to: "/merchant",      icon: Store,          label: "Merchant"       },
  { to: "/security",      icon: ShieldCheck,    label: "Security"       },
  { to: "/pension",       icon: Landmark,       label: "Pension"        },
  { to: "/referrals",     icon: UserPlus,       label: "Refer & Earn"   },
  { to: "/wire-transfer", icon: ArrowRightLeft, label: "Wire Transfer"  },
  { to: "/tax",           icon: Receipt,        label: "Tax Center"     },
  { to: "/challenges",    icon: Gamepad2,       label: "Challenges"     },
  { to: "/travel",        icon: MapPin,         label: "Travel"         },
  // Batch 4
  { to: "/social",         icon: Users2,        label: "Social Feed"    },
  { to: "/escrow",         icon: Lock,          label: "Escrow"         },
  { to: "/payment-links",  icon: LinkIcon,      label: "Payment Links"  },
  { to: "/portfolio",      icon: BarChart2,     label: "Portfolio"      },
  { to: "/family",         icon: Home2,         label: "Family Account" },
  // Batch 5
  { to: "/airtime-data",   icon: PhoneCall,     label: "Airtime & Data"  },
  { to: "/bill-payments",  icon: FileText,      label: "Bill Payments"   },
  { to: "/loan-calc",      icon: Calculator,    label: "Loan Calculator" },
  { to: "/alerts",         icon: AlertOctagon,  label: "Alerts"          },
  { to: "/crypto",         icon: Coins,         label: "Crypto"          },
];

const BOTTOM_NAV = [
  { to: "/notifications", icon: Bell,        label: "Notifications" },
  { to: "/kyc",           icon: User,        label: "KYC Verify"    },
  { to: "/support",       icon: HelpCircle,  label: "Support"       },
  { to: "/settings",      icon: Settings,    label: "Settings"      },
  { to: "/profile",       icon: User,        label: "Profile"       },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { balance } = useWalletStore();
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-gray-100 fixed left-0 top-0 bottom-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-9 h-9 bg-brand-gradient rounded-2xl flex items-center justify-center shadow-float-green">
          <span className="text-white font-display font-bold">O</span>
        </div>
        <div>
          <span className="font-display font-bold text-gray-900 text-xl">OPay</span>
          <span className="ml-1.5 text-[10px] bg-brand-50 text-brand-700 font-bold px-1.5 py-0.5 rounded-md">
            v10
          </span>
        </div>
      </div>

      {/* User card */}
      {user && (
        <div
          className="mx-3 mt-4 mb-1 bg-brand-gradient rounded-2xl p-3 relative overflow-hidden cursor-pointer"
          onClick={() => navigate("/profile")}
        >
          <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full border-[10px] border-white/10" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">
                {getInitials(user.firstName, user.lastName)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-white truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-brand-100 font-mono font-bold">
                {formatCurrency(balance, "NGN", true)}
              </p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {/* MAIN */}
        <p className="section-label mt-2">Main</p>
        {MAIN_NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-2xl mb-0.5 text-sm font-semibold transition-all duration-150",
                isActive
                  ? "bg-brand-600 text-white shadow-float-green"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} strokeWidth={isActive ? 2.5 : 1.8} />
                {label}
              </>
            )}
          </NavLink>
        ))}

        {/* MORE */}
        <button
          onClick={() => setShowMore((v) => !v)}
          className="flex items-center justify-between w-full px-3 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 mt-2"
        >
          <span className="section-label mb-0">More Features</span>
          <ChevronDown size={12} className={cn(showMore && "rotate-180")} />
        </button>

        {showMore &&
          MORE_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-2xl mb-0.5 text-sm font-medium",
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} strokeWidth={isActive ? 2.5 : 1.8} />
                  {label}
                </>
              )}
            </NavLink>
          ))}

        {/* ACCOUNT */}
        <p className="section-label mt-4">Account</p>
        {BOTTOM_NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-2xl mb-0.5 text-sm font-medium",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} strokeWidth={isActive ? 2.5 : 1.8} />
                {label}
                {label === "Notifications" && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* LOGOUT */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={async () => {
            try {
              await logout();
              navigate("/login");
            } catch {
              toast.error("Logout failed");
            }
          }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50"
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

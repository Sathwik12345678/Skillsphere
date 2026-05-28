import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import ButtonLoader from "../components/ButtonLoader";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
};

const money = (amount, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const statusStyles = {
  pending: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  paid: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
  released: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  failed: "border-rose-300/30 bg-rose-300/10 text-rose-100",
  refunded: "border-slate-300/30 bg-slate-300/10 text-slate-100",
};

export default function Payments() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser);
  const [payments, setPayments] = useState([]);
  const [checkoutOptions, setCheckoutOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");

  const canCreateCheckout = user?.role === "client" || user?.role === "admin";

  const totals = useMemo(() => {
    return payments.reduce(
      (summary, payment) => {
        if (["paid", "released"].includes(payment.status)) {
          summary.secured += Number(payment.amount || 0);
          summary.fees += Number(payment.platformFee || 0);
        }
        if (payment.status === "released") {
          summary.released += Number(payment.amount || 0) - Number(payment.platformFee || 0);
        }
        return summary;
      },
      { secured: 0, released: 0, fees: 0 }
    );
  }, [payments]);

  const loadPayments = async () => {
    setLoading(true);

    try {
      const profileRes = await api.get("/auth/me");
      setUser(profileRes.data.user);
      localStorage.setItem("user", JSON.stringify(profileRes.data.user));

      const requests = [api.get("/payments")];
      if (["client", "admin"].includes(profileRes.data.user.role)) {
        requests.push(api.get("/payments/checkout-options"));
      }

      const [paymentRes, optionRes] = await Promise.all(requests);
      setPayments(paymentRes.data.payments || []);
      setCheckoutOptions(optionRes?.data?.proposals || []);
    } catch (error) {
      toast.error(error.response?.data?.msg || "Could not load payments");
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    loadPayments();
  }, [navigate]);

  const createCheckout = async (proposalId) => {
    setWorkingId(proposalId);

    try {
      const res = await api.post("/payments/checkout", {
        proposalId,
        currency: "USD",
        method: "mock",
      });
      setPayments((current) => {
        const exists = current.some((payment) => payment._id === res.data.payment._id);
        return exists
          ? current.map((payment) => (payment._id === res.data.payment._id ? res.data.payment : payment))
          : [res.data.payment, ...current];
      });
      await loadPayments();
      toast.success("Checkout created");
    } catch (error) {
      toast.error(error.response?.data?.msg || "Could not create checkout");
    } finally {
      setWorkingId("");
    }
  };

  const updatePayment = async (paymentId, action) => {
    setWorkingId(`${paymentId}:${action}`);

    try {
      const res = await api.post(`/payments/${paymentId}/${action}`, { method: "mock" });
      setPayments((current) =>
        current.map((payment) => (payment._id === paymentId ? res.data.payment : payment))
      );
      toast.success(action === "confirm" ? "Payment confirmed" : "Payment released");
    } catch (error) {
      toast.error(error.response?.data?.msg || "Could not update payment");
    } finally {
      setWorkingId("");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-24 text-white">
        <ButtonLoader label="Loading payments" />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 pb-16 pt-32 lg:px-10">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]"
      >
        <aside className="grid content-start gap-6">
          <section className="rounded-[28px] border border-white/15 bg-white/10 p-6 shadow-[0_30px_120px_rgba(8,15,31,0.35)] backdrop-blur-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">Payments</p>
            <h1 className="mt-3 font-display text-4xl font-bold text-white">Secure project checkout</h1>
            <p className="mt-4 leading-7 text-slate-300">
              Create mock checkouts for accepted proposals, confirm payment, and release funds after delivery.
            </p>

            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                <p className="text-sm text-cyan-100">Secured volume</p>
                <p className="mt-1 text-2xl font-extrabold text-white">{money(totals.secured)}</p>
              </div>
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
                <p className="text-sm text-emerald-100">Released earnings</p>
                <p className="mt-1 text-2xl font-extrabold text-white">{money(totals.released)}</p>
              </div>
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                <p className="text-sm text-amber-100">Platform fees</p>
                <p className="mt-1 text-2xl font-extrabold text-white">{money(totals.fees)}</p>
              </div>
            </div>
          </section>

          {canCreateCheckout ? (
            <section className="rounded-[28px] border border-white/15 bg-white/10 p-6 shadow-[0_30px_120px_rgba(8,15,31,0.35)] backdrop-blur-2xl">
              <p className="text-sm uppercase tracking-[0.3em] text-amber-200">Accepted proposals</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-white">Start checkout</h2>

              <div className="mt-6 grid gap-3">
                {checkoutOptions.length ? (
                  checkoutOptions.map((proposal) => {
                    const hasPayment = Boolean(proposal.payment);
                    return (
                      <div key={proposal._id} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                        <p className="font-semibold text-white">{proposal.gig?.title}</p>
                        <p className="mt-1 text-sm text-slate-300">
                          {proposal.freelancer?.name} - {money(proposal.bidAmount)}
                        </p>
                        <button
                          type="button"
                          disabled={hasPayment || workingId === proposal._id}
                          onClick={() => createCheckout(proposal._id)}
                          className="mt-4 w-full rounded-2xl bg-gradient-to-r from-amber-300 to-cyan-300 px-5 py-3 font-bold text-slate-950 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {hasPayment
                            ? `Payment ${proposal.payment.status}`
                            : workingId === proposal._id
                              ? "Creating..."
                              : "Create Checkout"}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="rounded-2xl border border-white/10 bg-white/10 p-4 text-slate-300">
                    No accepted proposals are ready for checkout yet.
                  </p>
                )}
              </div>
            </section>
          ) : null}
        </aside>

        <section className="grid content-start gap-4">
          <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 shadow-[0_30px_120px_rgba(8,15,31,0.35)] backdrop-blur-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">Ledger</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-white">{payments.length} payment records</h2>
          </div>

          {payments.length ? (
            payments.map((payment) => {
              const isPayer = String(payment.payer?._id || payment.payer) === String(user?._id);
              const canConfirm = (isPayer || user?.role === "admin") && payment.status === "pending";
              const canRelease = (isPayer || user?.role === "admin") && payment.status === "paid";

              return (
                <article
                  key={payment._id}
                  className="rounded-[28px] border border-white/15 bg-white/10 p-6 shadow-[0_30px_120px_rgba(8,15,31,0.32)] backdrop-blur-2xl"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                          statusStyles[payment.status] || statusStyles.pending
                        }`}
                      >
                        {payment.status}
                      </span>
                      <h3 className="mt-4 font-display text-2xl font-bold text-white">
                        {payment.gig?.title || "SkillSphere project"}
                      </h3>
                      <p className="mt-2 text-sm text-slate-300">
                        {payment.payer?.name || "Client"} to {payment.payee?.name || "Freelancer"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-5 py-4">
                      <p className="text-sm text-amber-100">Amount</p>
                      <p className="mt-1 text-2xl font-extrabold text-white">
                        {money(payment.amount, payment.currency)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm text-slate-300 md:grid-cols-3">
                    <span>Provider: {payment.provider}</span>
                    <span>Order: {payment.providerOrderId}</span>
                    <span>Fee: {money(payment.platformFee, payment.currency)}</span>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-5">
                    {canConfirm ? (
                      <button
                        type="button"
                        disabled={workingId === `${payment._id}:confirm`}
                        onClick={() => updatePayment(payment._id, "confirm")}
                        className="rounded-2xl bg-gradient-to-r from-amber-300 to-cyan-300 px-5 py-3 font-bold text-slate-950 hover:-translate-y-1 disabled:opacity-60"
                      >
                        Confirm Payment
                      </button>
                    ) : null}
                    {canRelease ? (
                      <button
                        type="button"
                        disabled={workingId === `${payment._id}:release`}
                        onClick={() => updatePayment(payment._id, "release")}
                        className="rounded-2xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-5 py-3 font-bold text-slate-950 hover:-translate-y-1 disabled:opacity-60"
                      >
                        Release Funds
                      </button>
                    ) : null}
                    <Link
                      to="/dashboard"
                      className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white hover:bg-white/15"
                    >
                      Dashboard
                    </Link>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-[28px] border border-white/15 bg-white/10 p-10 text-center text-slate-300 backdrop-blur-2xl">
              No payments yet.
            </div>
          )}
        </section>
      </motion.section>
    </main>
  );
}

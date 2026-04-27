import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Compass, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !companyName) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await signup(name, email, password, companyName);
      navigate("/");
    } catch (err: any) {
      const msg =
        err?.code === "auth/email-already-in-use"
          ? "An account with this email already exists."
          : err?.code === "auth/invalid-email"
          ? "Please enter a valid email address."
          : "Failed to create account. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="h-7 w-7 rounded bg-primary flex items-center justify-center">
            <Compass className="h-4 w-4 text-primary-foreground" strokeWidth={2.25} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Founder's Compass</span>
        </div>

        <div className="bg-card border border-border rounded-md p-8">
          <h1 className="text-[20px] font-semibold tracking-tight mb-1">Create your account</h1>
          <p className="text-[12.5px] text-muted-foreground mb-6">
            Start prioritizing with AI in under a minute.
          </p>

          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded border border-destructive/30 bg-destructive/5 text-destructive text-[12.5px] mb-4">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <Field id="signup-name" label="Full name" type="text" autoComplete="name" placeholder="Ada Lovelace" value={name} onChange={setName} />
            <Field id="signup-email" label="Work email" type="email" autoComplete="email" placeholder="ada@company.com" value={email} onChange={setEmail} />
            <div className="space-y-1.5">
              <label htmlFor="signup-password" className="text-[11.5px] font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-9 pl-3 pr-9 rounded border border-input bg-card text-[13px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <Field id="signup-company" label="Company name" type="text" autoComplete="organization" placeholder="Acme Corp" value={companyName} onChange={setCompanyName} />

            <button
              id="signup-submit"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 h-9 mt-2 rounded bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating account
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="text-center text-[12px] text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>

        <p className="text-center text-[11px] text-muted-foreground/70 mt-6">
          By creating an account you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
};

const Field = ({
  id,
  label,
  type,
  autoComplete,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="text-[11.5px] font-medium text-foreground">
      {label}
    </label>
    <input
      id={id}
      type={type}
      autoComplete={autoComplete}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-9 px-3 rounded border border-input bg-card text-[13px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-colors"
    />
  </div>
);

export default Signup;

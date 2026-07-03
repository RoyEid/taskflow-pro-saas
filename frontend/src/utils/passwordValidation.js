export const checkPasswordRules = (password) => {
  const reqLength = password.length >= 8;
  const reqUpper = /[A-Z]/.test(password);
  const reqLower = /[a-z]/.test(password);
  const reqNum = /[0-9]/.test(password);

  const rules = [
    { id: "length", label: "8+ Characters", passed: reqLength },
    { id: "upper", label: "Uppercase", passed: reqUpper },
    { id: "lower", label: "Lowercase", passed: reqLower },
    { id: "number", label: "Number", passed: reqNum },
  ];

  const score = rules.filter(r => r.passed).length;
  const allPassed = score === rules.length;

  let strengthLabel = "Weak";
  let barColor = "bg-red-500";

  if (allPassed) {
    strengthLabel = "Strong";
    barColor = "bg-emerald-500";
  } else if (score >= 2) {
    strengthLabel = "Medium";
    barColor = "bg-amber-500";
  }

  return {
    rules,
    score,
    allPassed,
    strengthLabel,
    barColor,
  };
};

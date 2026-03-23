# Root Cause Review Checklist

1. Is the bug summary precise?
2. Do the action steps describe a plausible reproduction path?
3. Is expected behavior explicit?
4. Is actual behavior explicit?
5. Does the report preserve critical bug metadata?
6. Which specific repro step triggers the claimed root-cause flow?
7. Do the reported repro steps actually exercise the claimed cause?
8. Does the report explain the intermediate state change or decision point between trigger and symptom?
9. Does the evidence connect each major causal link to the observed symptom?
10. For each major causal link, is it proven, inferred, or unsupported?
11. Does the explanation account for the exact expected-versus-actual gap?
12. Does the claimed root cause stay consistent with platform or environment constraints in the bug metadata?
13. Is the confidence level justified by the available evidence?
14. Is the claimed root cause actually a cause instead of a symptom?
15. Were alternative explanations considered?
16. What exact evidence gap remains, and does it require `insufficient-evidence`?

# ISL recogniser evaluation

Clips used: 271 (unusable: 0). Signs: 10. 5-fold cross-validation, unseen clips only.

Top-1 accuracy over all signs: 0.956. Acceptance threshold: p >= 0.6.

| Sign | Clips | Accepted when signed | Wrongly accepted (other greetings + unrelated signs) | Unrelated signs accepted | Supported |
|---|---|---|---|---|---|
| Alright | 20 | 95% | 0.0% | 0.0% | yes |
| Good Morning | 20 | 80% | 0.4% | 0.0% | yes |
| Good afternoon | 21 | 95% | 0.0% | 0.0% | yes |
| Good evening | 21 | 90% | 0.0% | 0.0% | yes |
| Good night | 21 | 71% | 0.8% | 0.0% | no |
| Hello | 20 | 95% | 0.0% | 0.0% | yes |
| How are you | 21 | 100% | 0.0% | 0.0% | yes |
| Pleased | 21 | 95% | 0.4% | 0.0% | yes |
| Thank you | 21 | 81% | 0.0% | 0.0% | yes |
| _other | 85 | 98% | 0.5% | 0.0% | no |

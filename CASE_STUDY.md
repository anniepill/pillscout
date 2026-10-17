# PillScout case study

I spent sixteen months building a tool to answer one question: is everything in my medicine cabinet safe to take together? Then I ran a test that could end it, and it did. This is the short version. The test write-up and the repository have the details.

## What I built

I am not a pharmacist and I had never written code. In June 2025, with Cursor and Claude, I built a web app. A guide named Scout walked you through your prescriptions, supplements and over-the-counter bottles, checked them against each other, and added up what you were really getting. It worked well enough to catch a family member taking more zinc than she was meant to, from two bottles nobody had looked at together.

Then I looked under it. When the app did not know an item, an AI model guessed the ingredients and the interactions from memory, and the guess sat next to real data with nothing to tell them apart. Half the interaction cards had no source. The totals page said FDA Daily Values; several numbers were something else. For a safety tool, close is not a grade.

So in April 2026 I started over on the data. The new rule: every statement is a quote from a named regulator or published study, tied to the exact place in the document it came from. If no source says it, the record does not say it, and silence means no one said it, never that something is safe. By October it held 21 ingredients, 745 located quotes, and 3,525 automated checks. Models drafted; I made every judgment call about what counts; the checks enforced it.

## The test

The models kept getting better, so I kept asking whether a person at home still needed this. In October I put the same questions to four current models, with PillScout's records and without. With web search alone, every model found every interaction I had planted. With my records added, they cited more regulators but gave the same advice, and they searched less. One stopped searching altogether and missed a real finding because my file said nothing about it.

I had the raw answers reviewed with no product name attached. The reviews were from models, so I weigh them as a check on my own scoring, not as a verdict, and they did catch me overstating my results. The verdict is the numbers. I stopped.

## What I keep

A partial trusted file makes a model search less, and that can hide a real finding. That is true well beyond PillScout.

The method of proving a stored statement matches its source, which every reviewer said was the part worth keeping.

Fourteen catalogued ways an assistant drifted from the data it was given, and the fixes that held: not telling the model to be careful, but shaping the data so the unsafe move is harder than the safe one.

And this about myself. I am not an engineer and do not want to be one. I know enough to work beside the people who are, follow what they build, and keep up with where the tools are going. What I am good at is operations: turning a direction into a working system, and running the test that might end it.

# The Slang Language Change Process

Changes that touch Slang's language and user-facing interfaces, including syntax, core module and public APIs need to follow the language change process described in this document.

File an “Feature Proposal” issue on our github with associated FeatureTracker label to begin including all template fields included. You will need to be a committer, or ask a contributor,community member or greater access to the repo to do this, see the “community” section for how to do so.
This will be your “Feature tracker’ and you’ll need to keep it updated.

Include in the proposal a link to your design — a link to a PR, google doc, your choice.

Announce the intent to experiment feature to [designated channel on Slang’s GitHub forum] slang-features@slang-lang.org
Assuming positive community support for your proposal, move your tracking issue’s status to “Implementation” and begin putting up PRs for reviews by relevant code OWNERs.

Reference docs (language ref, library ref) should be updated regularly during this process to allow the community to try your feature out.
Note that the implementation of a new feature is being made as commits to top-of-tree, albeit marked as experimental (and thus requiring an opt-in by users). The usual process for reviewing and merging pull requests will apply; there is not a separate, lower, quality bar for code changes related to experimental features.

When your feature is stable enough to consider “stable”, announce your “Intention to stabilize” the feature on the issue and on [designated channel on Slang’s GitHub forumslang-features@slang-lang.org and switch the feature tracker to “proposing to stabilize”. If you are not a committer, you will need to ask a committer to make this change for you.

Include in that PRs that (a) mark your feature stable in the code, (b) creates a doc in docs/feature_proposals/ that is the final form of your feature design, and (c) updates the spec.

We encourage sending the intention to stabilize well in advance of wanting to actually have it ship stably — the more time, the more community feedback and ‘banging on the tires’ you can create.

At decision time, the docs/features_proposals/OWNERs will discuss privately (using OWNERs consensus) and share their decision on the email thread. After this, the relevant PRs can land as normal and the feature is stable.

We expect that between 3-7 days will be given for community feedback in typical cases. Some lived experience is needed before we can make a policy about how long review periods need to last.

The total time spent from creation of the tracking issue to when a feature is marked stable may vary with the complexity of a feature, but we expect that it will typically fall in the 1-3 month range. Even if a small feature might be proposed and implemented in a matter of days, it would need to be given sufficient time in the experimental state for community engagement and feedback before being considered for stabilization.

## Feature deprecation and removal
~= same flow as features — announce to deprecate, plan and timeframe for backcompat, waiting period for community & OWNER feedback, then removal. Will refine when we get to this.

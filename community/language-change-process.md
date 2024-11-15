# The Slang Feature Change Process

Changes that touch Slang's language and user-facing interfaces, including syntax, core module and public APIs need to follow the feature change process described in this document.

Before undertaking the rest of the process, you are encouraged to "pitch" your idea on the Slang GitHub forum, in order to solicit informal feedback from the community. Feedback at this stage can help refine an idea, suggest directions, and identify potential collaborators.

## File a Feature Tracker
The first step of doing a feature change is to file a "Feature Tracker" issue on our github with associated FeatureTracker label to begin including all template fields included. You will need to be a committer, or ask a committer or community member with greater access to the repo to do this, see [community structure](/community/index#community-structure) for how to do so.

This will be your "Feature Tracker" and you'll need to keep it updated.

## Feature Proposal
In the feature tracker issue, include in the proposal a link to your design — a link to a PR, google doc, your choice.
The proposal document should include the detailed design and proposed changes in the Slang compiler implementation.

## Announce the Experimental Feature

Announce your intent to implement the feature in the [Announcement Channel in GitHub Discussions](https://github.com/shader-slang/slang/discussions/categories/announcements).

## Iterate on design and implementation

The Owners of docs/proposals (aka the "Language Owners") may weigh in on feature proposal issues to give guidance on what they expect will or will not be accepted as changes to the language.

If it is clear to the Language Owners that a proposed feature will not be accepted, they may close out the issue with an explanation of the reasoning.
Ideally, you should wait to get positive feedback from at least one Language Owner before moving forward with implementation, to avoid the possibility of wasted effort.
The Language Owners are responsible for making a decision on whether or not to proceed with implementation for all proposals to remove the ambiguity in the case of insufficient or mixed community feedback.

With positive support for your proposal from the Language Owners, move your tracking issue's status to "experimental" and begin putting up PRs for reviews by relevant code Owners.

During the implementation period, you are expected to:

- Keep reference docs (language ref, library ref) updated regularly along with implementation pull requests to allow the community to try your feature out.

- Commit the implementation of a new feature to top-of-tree, and marked the feature as experimental (and thus requiring an opt-in by users).

- Maintain the same level of code quality as other changes to the codebase. Note that the usual process for reviewing and merging pull requests will apply to your experimental feature implemnetation; there is not a separate, lower, quality bar for code changes related to experimental features.

## Transition to Stable Status

When your feature is stable enough to consider "stable", announce your "Intention to stabilize" the feature on the issue and on the [Announcement Channel in GitHub Discussions](https://github.com/shader-slang/slang/discussions/categories/announcements) and switch the feature tracker to "proposing to stabilize". If you are not a committer, you will need to ask a committer to make this change for you.

Include in that PRs that (a) mark your feature stable in the code, (b) creates a doc in docs/feature_proposals/ that is the final form of your feature design, and (c) updates the spec.

We encourage sending the intention to stabilize well in advance of wanting to actually have it ship stably — the more time, the more community feedback and ‘banging on the tires’ you can create.

At decision time, the Owners listed in `.github/CODEOWNERS` will discuss privately (using Owners consensus) and share their decision on the email thread. After this, the relevant PRs can land as normal and the feature is stable.

We expect that between 3-7 days will be given for community feedback in typical cases. Some lived experience is needed before we can make a policy about how long review periods need to last.

The total time spent from creation of the tracking issue to when a feature is marked "stable" may vary with the complexity of a feature, but we expect that it will typically fall in the 1-3 month range. Even if a small feature might be proposed and implemented in a matter of days, it would need to be given sufficient time in the experimental state for community engagement and feedback before being considered for stabilization.

## Feature Deprecation and Removal

The process for the deprecation and removal of features follows a similar flow to that of feature additions: announce the deprecation, plan for backward compatibility, allow a waiting period for community and OWNER feedback, and then proceed with the removal. This process will be refined as we progress.

In cases where an existing feature of the language (even one that was present from before this process, and that thus has no corresponding proposal) is found to be undesirable, a proposal can be made for deprecation and eventual removal of that feature.

Superficially, proposals for deprecation and removal follow the same overall flow as feature additions. In particular, these proposals must be announced in the same channels, and sufficient time for community review must be given before a deprecation is "stabilized," so that it takes effect.

Compared to purely additive features, deprecation and removal comes with a higher risk of breaking existing Slang codebases. As such, proposals for deprecation are expected to include detailed plans around the timeline for sunsetting a feature that is to be removed, potential impact of the removal on existing codebases, and strategies for migration of code using the feature to suitable alternatives.

The Language Owners are expected to scrutinize proposals for deprecation with great care, and to engage with stakeholders including organizations with large Slang codebases.


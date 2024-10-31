# The Slang Feature Change Process

Changes that touch Slang's language and user-facing interfaces, including syntax, core module and public APIs need to follow the feature change process described in this document.

## File a Feature Tracker
The first step of doing a feature change is to file an "Feature Tracker" issue on our github with associated FeatureTracker label to begin including all template fields included. You will need to be a committer, or ask a committer or community member with greater access to the repo to do this, see [community structure](/community/index#community-structure) for how to do so.

This will be your "Feature tracker" and you'll need to keep it updated.

## Feature Proposal
In the feature tracker issue, include in the proposal a link to your design — a link to a PR, google doc, your choice.
The proposal document should include the detailed design and proposed changes in the Slang compiler implementation.

## Annouce the Experimental Feature

Announce the intent to experiment feature in the [Announcement Channel in GitHub Discussions](https://github.com/shader-slang/slang/discussions/categories/announcements). Assuming positive community support for your proposal, move your tracking issue’s status to “Implementation” and begin putting up PRs for reviews by relevant code OWNERs.

## Submit Pull Requests

Once announced, you can begin the work to implement the proposed feature, and iterate on implementation, design documentation and user reference documentation at the same time. The implementation can be merged to main branch at any frequency agreed by the dev team and the owner of the feature.

Reference docs (language ref, library ref) should be updated regularly during this process along with implementation pull requests to allow the community to try your feature out.

Note that the implementation of a new feature is being made as commits to top-of-tree, albeit marked as experimental (and thus requiring an opt-in by users). The usual process for reviewing and merging pull requests will apply; there is not a separate, lower, quality bar for code changes related to experimental features.

## Transition to Stable Status

When your feature is stable enough to consider "stable", announce your "Intention to stabilize" the feature on the issue and on the [Announcement Channel in GitHub Discussions](https://github.com/shader-slang/slang/discussions/categories/announcements) and switch the feature tracker to "proposing to stabilize". If you are not a committer, you will need to ask a committer to make this change for you.

Include in that PRs that (a) mark your feature stable in the code, (b) creates a doc in docs/feature_proposals/ that is the final form of your feature design, and (c) updates the spec.

We encourage sending the intention to stabilize well in advance of wanting to actually have it ship stably — the more time, the more community feedback and ‘banging on the tires’ you can create.

At decision time, the owners listed in `docs/proposals/OWNERS.txt` will discuss privately (using OWNERs consensus) and share their decision on the email thread. After this, the relevant PRs can land as normal and the feature is stable.

We expect that between 3-7 days will be given for community feedback in typical cases. Some lived experience is needed before we can make a policy about how long review periods need to last.

The total time spent from creation of the tracking issue to when a feature is marked stable may vary with the complexity of a feature, but we expect that it will typically fall in the 1-3 month range. Even if a small feature might be proposed and implemented in a matter of days, it would need to be given sufficient time in the experimental state for community engagement and feedback before being considered for stabilization.

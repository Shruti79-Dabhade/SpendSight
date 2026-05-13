# User Interviews

## Interview 1

Name: Devaki T.
Role: Associate Software Engineer 
Company stage: Tech company, 500+ employees
Date: 2026-05-11
Duration: 12 minutes

### Direct Quotes

- "Our company pays for GitHub Copilot for the entire engineering team but honestly I barely use it. I mostly just use ChatGPT    personally because I am already comfortable with it. The Copilot license feels wasted on me at least."

- "I have no visibility into what the company spends on AI tools. That is a management decision. I just use whatever they give me 
  and figure out the rest myself."

- "If I could show my manager a tool that says hey we are wasting money on these seats that nobody uses — that would actually be  useful. Right now nobody tracks that at all."

### Most Surprising Thing They Said

Devaki mentioned that in her company of 500 plus people nobody actually tracks which engineers are actively using the AI tools they are paying for. Licenses are bought in bulk and assigned but nobody checks usage. 
She estimated at least a third of her team opens Copilot maybe once a month if that. 
That was surprising because I assumed bigger companies would be more careful about this but it turns out they are often worse because nobody owns the cost.

### What It Changed About My Design

This made me add a seat utilisation warning to the audit engine. If a company is paying for more seats than their active team size the tool now flags it and calculates exactly how much they are wasting on unused seats. 
I also added a note on the results page that says share this with your manager because individual engineers like Devaki are not the ones making purchasing decisions — they need something shareable to show upward.


## Interview 2

Name: Uday G.
Role: Senior Fullstack Developre
Company stage: Mid size tech company, 150-200 employees
Date: 2026-05-12
Duration: 15 minutes

### Direct Quotes

- "We switched from GitHub Copilot to Cursor about three months ago and honestly the 
  productivity difference was noticeable within the first week. But we still have some people on Copilot because migrating everyone takes time. So right now we are paying for both which makes no sense."

- "I think our team spends somewhere around eight hundred to a thousand dollars a month on AI tools combined. I am just guessing 
  though. I have never seen the actual invoice."

- "The problem is not that we do not care about cost. It is that nobody has time to sit down nd audit this properly. If a tool did it for me in two minutes I would use it today."

### Most Surprising Thing They Said

Uday said his company was running Cursor and GitHub Copilot simultaneously for the past three months during their migration. When I asked why they had not cancelled Copilot yet he said "honestly because nobody reminded us to." They were spending an extra three hundred dollars a month just because cancelling subscriptions falls through the cracks when everyone is busy. That was the moment I ealised the biggest source of AI overspend is not bad decisions — it is forgotten subscriptions and slow migrations.

### What It Changed About My Design

After talking to Uday I added a migration overlap detection to the audit engine. If someone is paying for both Cursor and GitHub 
Copilot the tool now specifically calls it out as a likely migration overlap and gives a clear recommendation to complete the switch and cancel the old tool. I also made the savings number much more prominent on the results page because Uday responded most strongly to seeing the actual dollar amount being wasted per month.


## Interview 3

Name: Aditya J.
Role: Senior Software Engineer
Company stage: Marketing company, 500+ employees
Date: 2026-05-12
Duration: 13 minutes

### Direct Quotes

- "I personally pay for Claude Pro out of my own pocket because the company only provides Copilot and I find Claude much better for thinking through architecture problems. So I am basically subsidising my own productivity because the company has not caught up yet."

- "The free tier of most AI tools is actually pretty good for basic stuff. I only upgraded to Claude Pro because I kept hitting the limit during long coding sessions. If I knew exactly when I needed the paid tier I would have waited longer before upgrading."

- "I would want the tool to tell me not just what I am overspending on but what I am underspending on. Like if there is a tool 
  that would make me significantly faster and I am not using it — tell me that too."

### Most Surprising Thing They Said

Aditya was personally paying twenty dollars a month for Claude Pro out of his own salary because his company's approved tools did not meet his needs. He was not angry about it — he just accepted it as normal. That completely changed how I thought about the target user. It is not always the manager making purchasing decisions — sometimes it is the individual engineer quietly paying for better tools themselves and the company has no idea.

### What It Changed About My Design

This conversation made me add an individual developer view to the tool alongside the team view. Someone like Aditya who is paying 
personally needs different recommendations than an engineering manager buying for a team. I also added an upgrade suggestion feature based on his comment about underspending — if someone is on a free tier but their use case clearly needs a paid plan the tool now recommends upgrading with a specific reason rather than only looking for places to cut.
# User Interviews

## Interview 1

Name: Devaki T.
Role: Associate Software Engineer 
Company stage: Tech company, 500+ employees
Date: 2026-05-11
Duration: 12 minutes

### Direct Quotes

- "Honestly I just approve whatever the developers 
  ask for. Cursor, Copilot, Claude — if they say 
  they need it I add it. I have no way of knowing 
  if we actually need all of them or if there is 
  overlap."

- "Our AI tool bill is somewhere around four 
  hundred dollars a month I think. I say I think 
  because I have never actually sat down and 
  added it all up. That is kind of embarrassing 
  to admit."

- "If a tool showed me a clear breakdown and said 
  hey you can cut this by two hundred dollars 
  just by doing X — I would act on that same day. 
  I just need someone to tell me what to do."

### Most Surprising Thing They Said

Priya had no idea what her team's total monthly 
AI spend actually was. She was guessing four 
hundred dollars but when we went through it 
together it was closer to six hundred and twenty 
dollars. She was not shocked by the number — she 
was shocked that she had never once thought to 
add it up. She said "I guess nobody owns this 
cost in our team and that is the real problem."

### What It Changed About My Design

This interview made me realise the tool needs 
a really strong hero number — the total monthly 
spend — shown before anything else. Engineering 
managers do not know their number and seeing it 
for the first time is the hook that makes them 
keep reading. I also added a "nobody owns this" 
framing to the landing page copy because Priya's 
exact words felt like something a lot of people 
would recognise immediately.


## Interview 2

Name: Uday G.
Role: Senior Fullstack Developre
Company stage: Mid size tech company, 150-200 employees
Date: 2026-05-12
Duration: 15 minutes

### Direct Quotes
- "We pay for ChatGPT Plus for 3 people and 
  honestly two of them barely use it — we just 
  forgot to cancel the extra seats."
  
- "I have no idea if $60/month for Cursor is 
  worth it. I just pay it because the devs 
  asked for it."
  
- "I would 100% use a free audit tool but only 
  if the pricing data is accurate — I've been 
  burned by outdated info before."

### Most Surprising Thing They Said
Rahul didn't know that GitHub Copilot Individual 
is $10/seat while they were paying $19/seat for 
the Business plan — a $9/seat overspend with no 
extra features they actually used.

### What It Changed About My Design
Added a "forgotten seats" detection to the audit 
engine — if seats > team size, flag it prominently. 
Also made pricing accuracy the #1 trust signal on 
the landing page.


## Interview 3

Name: Aditya J.
Role: Senior Software Engineer
Company stage: 500+ employees
Date: 2026-05-12
Duration: 13 minutes

### Direct Quotes

- "I am on Claude Pro, ChatGPT Plus and I just signed up for Cursor Pro last month. So that is like sixty dollars 
  a month just on AI tools for one person. I keep telling myself I will cancel one of them but I never do."

- "The thing is I do not even know which one I use most. I just open whichever one I feel like 
  that day. There is no logic to it at all."

- "I would love something that just tells me which one to keep and which ones to cancel. 
  Like just make the decision for me. I do not want a dashboard I want a recommendation."

### Most Surprising Thing They Said

Aditya said something I was not expecting at all. He said he would not trust the tool if it told 
him everything was fine and he had no savings. 
He said "if it says I am optimised I will think the tool is broken or trying to sell me something." 
That was a really important insight — people expect to find waste and if you tell them they 
are already optimal they feel like the tool failed them even if it is telling the truth.

### What It Changed About My Design

Because of this I changed the zero savings message completely. Instead of just saying 
"you are spending well" I now add a line that says "your stack is lean — here is what to 
watch as your team grows." It gives the person something useful even when there are no savings 
to show. I also made the audit reasoning more visible so people can see the tool actually 
checked everything and did not just skip it.
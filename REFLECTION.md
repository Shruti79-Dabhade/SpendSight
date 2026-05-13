# Reflection

## 1. Hardest bug (150-200 words)

This week I ran into several bugs that tested my patience but also taught me the most.

The first one hit me right at the start. I ran git push and got a success message but none of my folders were showing on GitHub. 
Only the README was visible. I panicked a little honestly. My first thought was that the files were not staged properly so I ran 
git status — they were all there locally. Then I ran git branch and finally understood the problem. GitHub had created a master 
branch when I initialised the repo with a README but my local Git was pushing to main. Two separate branches and I was looking at 
the wrong one the whole time. Fixed it by running git checkout master and pushing again.

The second bug happened even before that. When I first opened Git Bash and started running commands I kept getting fatal: not 
a git repository error. I had created the folder manually on my desktop but never actually initialised it as a Git repository. 
I had skipped git init completely without realising it was a required first step. Once I ran git init everything started working.

The third bug was when I pasted all the terminal setup commands at once into Git Bash instead of running them one by one. 
Git Bash threw bash: EOF: command not found immediately and none of the files got created. The multiline cat and EOF commands 
broke when pasted together because the terminal could not process them all at once. I had to start over and run each command separately which fixed it completely.

The fourth and most frustrating bug came when I finally ran the project on localhost and tried submitting the form. I got this 
error in the browser:

{"error":"Invalid request body.",
"fieldErrors":{
  "tools":["Required"],
  "useCase":["Required"]
}}

The form was submitting successfully but the API was rejecting the data. I stared at this for a while before I realised what 
was happening. Cursor had generated the form component with certain field names but the Zod validation schema in the API 
route was expecting different field names. 
The two files were simply not talking to each other correctly. I opened both files side by side in Cursor and compared every 
field name one by one until I found the mismatch. Once I aligned the field names and made sure the form was sending tools 
as an array of objects with toolId, plan, monthlySpend and seats the error disappeared completely.

This last bug taught me the most important lesson of the week — never assume that two AI generated files will automatically be 
consistent with each other just because they came from the same tool. Cursor wrote both files but it did not guarantee they would work together. That human verification step of reading both files and comparing them manually is something I cannot skip no matter how much I trust the AI output.

Speaking of Cursor getting things wrong — yes it happened more than once. The most notable time was when Cursor generated a 
Supabase database query that used an outdated method. The code looked completely correct and there were no TypeScript errors but when I actually ran it the data was not being saved to the database properly. I only caught it because I checked the Supabase dashboard and noticed the audits table was empty even after several form submissions. I went back to the Supabase documentation 
myself and found that the correct way to insert and get the returned row back was to chain dot select after dot insert. Cursor 
had skipped that part entirely. I fixed it manually and it worked immediately. That moment made me realise that AI generated 
code always needs to be tested against real data and not just checked for syntax errors.


## 2. Decision you reversed (150-200 words)

When I first started setting up the project I decided to paste all the terminal commands at once in Git Bash to save time. I thought it would be faster than running them one by one since there were so many setup commands to run.

That decision backfired immediately. Git Bash got confused by the multiline cat and EOF commands when they were all pasted together and started throwing errors like bash: EOF: command not found and fatal: not a git repository. None of the files got created properly and the whole setup broke.

I reversed that decision completely and started running every single command one at a time waiting for each one to finish before 
moving to the next. It took a bit longer but everything worked correctly the second time.

What made me change my mind was realising that terminal commands are not like code — they are sequential instructions and the 
terminal needs to process each one fully before it is ready for the next. Pasting everything at once is like talking too fast 
and expecting someone to understand every word perfectly. Slow and steady actually saved me more time in the end.


## 3. What you'd build in week 2 (150-200 words)

If I had a second week I would focus on three things that would make SpendSight genuinely more useful and more shareable.

First I would build the PDF export feature. Right now the audit lives only on the web page but engineering managers and founders need something they can attach to a Slack message or email to their finance team. A clean one page PDF with the total savings 
and per tool breakdown would make the tool much more actionable in real company settings.

Second I would build the benchmark mode that shows how your AI spend per developer compares to companies of a similar size. From my user interviews I learned that people do not just want to know if they are overspending — they want to know if they are normal. Benchmarking gives them that context.

Third I would add a Slack integration so engineering managers can get a monthly audit reminder directly in their team channel. Most overspending happens not because people do not care but because they forget to check. A monthly Slack nudge with updated numbers would keep the tool relevant long after the first audit.

## 4. How you used AI tools (150-200 words)

I used Cursor as my primary coding tool throughout the week and Claude for planning and understanding the assignment requirements. Both were genuinely helpful but in very different ways.

Cursor was great for generating boilerplate code like the Next.js project setup, the Supabase client configuration, the API route 
handlers, and the React components. It saved me a significant amount of time on code that would have taken hours to write manually.

However there were clear limits to what I trusted it with. I did not trust Cursor with the pricing data — I verified every single price manually on each vendor's official website because outdated numbers would completely undermine the tool's credibility. I also did not trust it with the DEVLOG entries, the user interview writeups, or this reflection — those needed to come from my actual experience.

One specific time Cursor was wrong was when it generated a Supabase query using a method that did not work correctly with my project setup. The form was submitting successfully but the API kept returning a tools Required and useCase Required validation error. Cursor had generated field names in the form that did not match the Zod schema in the API route. 
I caught it by reading both files side by side and fixing the mismatch manually.

## 5. Self-ratings

- Discipline: 7/10 — 
  I committed code every day across the full week but some of my DEVLOG entries were written in the evening instead of right after finishing work which made them slightly less detailed than they could have been.

- Code quality: 7/10 — 
  I used TypeScript strict mode throughout and kept the audit engine logic clean and readable but some of the React components could be broken into smaller pieces for better maintainability.

- Design sense: 6/10 — 
  The UI is clean and functional with good color coding on the action badges but I did not have enough time to polish the mobile experience as much as I wanted to and the hero section could be more visually striking.

- Problem-solving: 8/10 — 
  I debugged the git branch mismatch and the form validation error independently by reading error messages carefully and forming hypotheses before trying random fixes which I think shows good debugging instincts.

- Entrepreneurial thinking: 7/10 — 
  I talked to three real engineers and developers for the user interviews and their feedback directly changed two features in the audit engine which shows I was thinking about real users and not just building what I assumed they needed.

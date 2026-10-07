# Daigo:
-  A carpooling app for students and office-goers. rider can post a request from to destination with App Push from that travel on that route from a different vehicle with price aggreed, and also if no single driver cover the route it can chain two driver through a relay with one transfer.
- Carpooling System for the Somethings that is shared but with key mvp features user can request their timing for the future timings
- With Key FEatures for the Affordable people with students and Working prffoffsional with a shareed people
- With a mvp also include a that real life a map system
- Where the Driver and the rider will connect and somethings unique features they cna make a multi driver for reach to the point, it's somethiing like blabla rather a Uber

## Tech Stack As of Now:
- Next.js
- TypeScript
- Zod
- Prisma
- Postgres
- Redis
- React.js
- 

## Something Tha I must Carefully Care:
- WE Make sure that the jsonwebtoken also must be the revokable for some user that we can suspsend based on that activity we can't just let those people to use it unless that time is expired we must have hte power to revoke that.
- With Prisma must be go with a unified folder for all the generation, schema and migration.
- With Prisma must be go with a unified folder for all the generation, schema and migration.
- With the Global Error handler we don't need to write a same try catch block every time.
- Also on the zod major issue i seee that for the not input or custom message it's not adding for that i've make my Custom Messages.
- With a Reusuable cookies we can make both refresh and teh access token content,
- Make a Bidirectional System with a User and the Vehicle
- Customized Zod Error Handler for the big value,small value smalll type rather than a default which is not good
- Make a try catch global from a error handler so we don't need every file repeated code.
-  

## I'm Working on Right Now:
- September 24: Core auth: User, EmergencyContact models; signup, login, refresh, forced-emergency-contact-form, /me routes
- @5 Start Building the Driver vehicl registration with licesnisng and the admin review system.
- Working on the Ride Request form a group request with invite by the mail with a vulnerable flag From a Matching a single driver orute overlap with a some limit from a stadia map and the postgres
- IMplementing the Matching Algorithm for people to match to the either bidirectional way.
- every trip you're on, as rider or driver
- either party, any time before completion; releases the seat back to the route and resets the ride request to PENDING so it can be matched again. Records who cancelled and an optional reason
- Initiate a Redis instance with a Upstash where also token is provided, with set only auth user can access it.
- Build a Full Auth System to the login/signup/email-verify/reset-password
- With on the our ride i also have completed the permanent ride request which can be also deleted by the rider.
- we've already done a geo tag that have already done with a postgis extension also have implemented i think pretty good.
- postgis needs a external extension setup also i'm using a raw query on that postgis due to not supported prisma as of now. 

## Feature That I Build In Flow:
- Starting with the normal auth setup where account setup, onboarding value, with the multi roles auth from a super admin to the admin to the moderator to the rider to the driver, with also verification method there where the vehicle and the license verification must be there with also the admin shell is there.
- Now the core features that i build is the new routes created by a rider with request goes to a relevent driver where the Postgres Prisma steup orm is done with also where the real time accepting system is initiate
- The Countdown which i've not yet build but i'm looking to build of 75 second timer with a driver alert is already sent. 
- The Dynamic Pricing Feature, where the otp goes to the rider with a complete trip lifecycle done from create to start routes to drop point but reveiw not done.
- The review where i again starting a prisma with can customer give a review rating
- The chat payment integration is not fully completed on the working stage with razorpay setup
- The safety and emergecy is build with send a laert with also a multi hop realy solving it with a privacy gate.
- The trust score where i'm trying to ubld myslef demo for giving a scoring a dynamic basis 
- Build the Pemanet route automation where the driver prev we've work give a priority to it.
- for vulnerbale peopel mean aged people sensitive and physical condiition or the baby give a vulnerable where give a top priority no matter what pricing to teh top rated driver.
- I'll plan to build admin analytcs just for now simple anlyyis how many register and simple 
- Need to build a dmeo console with a simulation to show to the recruiter with adding a i18n of benchmark run.


## Feature That I Will Build Earlier:
## Already Build Features:
- Auth Login/Signup/Reset Password/Email Confirmation System.
- Driver Vehicle Registeration License rc upload format check with a admin review where the limited status for the pre verification of license/vehicle.
- Regular route which are the auto posting automated with advance one of request mean one way two way with gap pre defined.
- Regular routes (auto-posting) plus advance one-off requests
- For hte ride reuqest it need a time people, luggae notes, vuln flag with prefences, and also can go a group request, it's done through a invite by email.
### Must Build:
- Auth (bcrypt + JWT access/refresh, httpOnly cookies), forced emergency-contact form, rider/driver role switch, multi-device sessions, password reset via Brevo
- Driver vehicle registration, licence/RC upload with format check, admin review, limited status pre-verification
Regular routes (auto-posting) plus advance requests, saved routes
- Ride requests: group requests, invite-by-email, vulnerable flag with explainer
- Matching: single-driver route overlap with detour limit and suggested meeting point (Postgres + Stadia Maps)
- Real-time accept flow: WebSocket + Redis pub/sub, big driver alert, 75s countdown, manual/auto-accept, first-accept-wins


## I'm Plan To Add This Feature:
Race conditions.
Payment integrity.
Duplicate transactions.
Idempotency.
Webhook verification.
Secondary: Concurrency Control, Idempotency, Webhook Integration, Payment Gateway Integration, RBAC, CI/CDOthers: Git, Linux, Postman,
Features i can addd on my Projects:
Idemptoenty Keys, while applying to the jobs.
Create also a one routes of the popular-routes for showing most pouplar jobs.
Implement a Redis For here.
Caching Layers on the /popular-jobs 
on the resume also hav to add a engineering problems ok
Race conditions.
Payment integrity.
Duplicate transactions.
Idempotency.
Webhook verification.
Secondary: Concurrency Control, Idempotency, Webhook Integration, Payment Gateway Integration, RBAC, CI/CDOthers: Git, Linux, Postman,
Features i can addd on my Projects:
Idemptoenty Keys, while applying to the jobs.
Create also a one routes of the popular-routes for showing most pouplar jobs.
Implement a Redis For here.
Caching Layers on the /popular-jobs 
Designed direct-to-storage file upload workflow using signed URLs to reduce backend resource consumption.
Implement a token Refresh
Accont Lock
use a Redis Stream for when the expired rides or running rides event, message queue and notification worker

## Rules That i Always Reminder:
- Always always must add if're working on the some external extension on the prisma/postgres always define first the extension i'lll help us to avoid a template default conflict.
- Always handle our property to the optional property that is alsoo i keep focus on.

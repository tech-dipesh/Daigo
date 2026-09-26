# Daigo:
- Carpooling System for the Somethings that is shared but with key mvp features user can request their timing for the future timings
- With Key FEatures for the Affordable people with students and Working prffoffsional with a shareed people
- With a mvp also include a that real life a map system
- Where the Driver and the rider will connect and somethings unique features they cna make a multi driver for reach to the point, it's somethiing like blabla rather a Uber

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


## Feature That I Will Build Earlier:
### Must Build:
- Auth (bcrypt + JWT access/refresh, httpOnly cookies), forced emergency-contact form, rider/driver role switch, multi-device sessions, password reset via Brevo
- Driver vehicle registration, licence/RC upload with format check, admin review, limited status pre-verification
Regular routes (auto-posting) plus advance requests, saved routes
- Ride requests: group requests, invite-by-email, vulnerable flag with explainer
- Matching: single-driver route overlap with detour limit and suggested meeting point (Postgres + Stadia Maps)
- Real-time accept flow: WebSocket + Redis pub/sub, big driver alert, 75s countdown, manual/auto-accept, first-accept-wins

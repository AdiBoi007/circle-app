# Live beta API contract (implementation)

Shared browser/native types: src/live/types.ts. Root owns client/session/provider, auth and invitation/family/operator routes. Backend agent owns practice/service/booking tables and endpoints. Live screens use useLive from '@/live/LiveProvider' and types, never useAppState/demo fixtures.

API prefix /api. All application endpoints require a valid Better Auth session and enrolled circle_profile unless marked public. Mutation errors {error:string}; HTTP non-2xx. JSON timestamps ISO, display IST, UUID app IDs, auth IDs strings. Mutations refresh bootstrap through LiveProvider.

GET /bootstrap -> LiveBootstrap role-filtered
GET /slots?serviceId=...&date=YYYY-MM-DD&mode=Online -> LiveSlots
POST /bookings -> LiveBookingInput including expectedPriceInr/expectedDurationMinutes from the review, returns {id}; quote changes reject with 409 before creating a booking, while committed matching idempotent retries return their original ID.
POST /bookings/:id/confirm {sessionDetails}
POST /bookings/:id/decline {reason}
POST /bookings/:id/cancel {reason}
POST /bookings/:id/complete {}
POST /bookings/:id/follow-up {text,dueDate} (own practitioner only)
POST /bookings/:id/follow-up/complete {} (attendee or authorised organiser)
PUT /practice -> LivePracticeInput (own practitioner profile)
PUT /practice/hours {hours:PracticeHours[]}
POST /practice/blocked-dates {date} (toggle)
POST /practice/services -> LiveServiceInput (id optional for update)
DELETE /practice/services/:id (reject open-booking refs, prefer deactivate)

GET /invitations/preview?token=... PUBLIC -> LiveInvitationPreview
POST /invitations {email,role:'client'|'practitioner'} operator; client accounts can only create roleclient purposefamily using {email,purpose:'family'} -> {id,url}
POST /invitations/:id/revoke {}
POST /invitations/accept {token} logged-in matching-email user; accepts family access or recovers an incomplete beta enrolment without changing an existing role
Sign up uses BetterAuth /auth/sign-up/email {name,email,password}, header x-circle-invitation:token. No open registration. New member explicitly accepts consent text shown by invitation screen before signing up.
POST /family/:id/revoke {} either participant
PUT /profile {name,viewPreference:'standard'|'simple'}
POST /notifications/:id/read {}
POST /operator/practices/:id/review {status:'Approved'|'Suspended',reason} operator
POST /operator/deliveries/:id/retry {} operator
GET /account/export returns own profile, own bookings, own grants (private response)
POST /account/close {confirmation:'DELETE'} closes app account, cancels open bookings, revokes grants and sessions, anonymises personal fields; minimal necessary audit retained, full retention review before external launch.

LiveProvider contract: useLive() returns {data:LiveBootstrap|null, loading:boolean,error:string|null,refresh():Promise<void>, get<T>(path:string):Promise<T>, mutate<T=unknown>(path:string,body?:unknown,method?:'POST'|'PUT'|'DELETE'):Promise<T>,signOut():Promise<void>}. Paths exclude /api. get/mutate throw Error on failure. Components show errors and async busy states. data non-null in workspace. API auth headers managed centrally.

Root route /beta contains authentication/invitation and authenticated workspace shell. Client UI agent exports LiveClient from src/live/LiveClient.tsx; practitioner/operator agent exports LivePracticeWorkspace and LiveOperatorWorkspace from matching files. Each can use local tabs and Sheets; no new Expo routes needed. Root provides shared UI primitives in src/live/ui.tsx: LivePage({title,subtitle?,children,action?}), LiveCard, LiveField({label,value,onChangeText,multiline?,secureTextEntry?,placeholder?,keyboardType?,maxLength?}), LiveNotice({message,error?}), LiveChip({label,selected,onPress}), liveStyles, dateLabel,timeLabel,price. Reuse Button/Text/Sheet from existingcomponents. Root provides LiveBookingDetail({booking,onClose}) in src/live/LiveBookingDetail.tsx for role-aware detail/actions (root implementation), or agent may call for details.

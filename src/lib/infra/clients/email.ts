const brevoApiUrl = "https://api.brevo.com/v3/smtp/email"
const fromEmail = process.env.BREVO_FROM_EMAIL ?? "no-reply@daigo.app"

type SendEmailParams = {
  to: string
  subject: string
  text: string
}

export async function sendEmail({ to, subject, text }: SendEmailParams) {
  const response = await fetch(brevoApiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "api-key": process.env.BREVO_API_KEY ?? "",
    },
    body: JSON.stringify({
      sender: { email: fromEmail, name: "DaiGo" },
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
  })

  if (!response.ok) {
    throw new Error(`Brevo send failed: ${response.status} ${await response.text()}`)
  }
}

export async function sendEmailBestEffort(params: SendEmailParams) {
  try {
    await sendEmail(params)
  } catch (error) {
    console.error(error)
  }
}

/* 
  we make a side effect not occupy main operation
  trip will create that all our system not fail
  i've the plan to move to pub sub
*/ 
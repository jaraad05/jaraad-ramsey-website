const ALLOWED_ORIGINS = new Set([
  "https://jaraadramsey.com",
  "https://www.jaraadramsey.com",
  "http://localhost:5173",
]);

const ALLOWED_GOALS = new Set([
  "Build strength",
  "Improve fitness",
  "Body composition",
  "Build sustainable habits",
]);

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function clean(value, limit) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function sendClientAutoReply(env, enquiry) {
  if (!env.AUTO_REPLY_URL || !env.AUTO_REPLY_SECRET) {
    console.error("Client auto reply is not configured");
    return false;
  }

  try {
    const response = await fetch(env.AUTO_REPLY_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        secret: env.AUTO_REPLY_SECRET,
        name: enquiry.name,
        email: enquiry.email,
        goal: enquiry.goal,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || result?.ok !== true) {
      console.error("Client auto reply was rejected", response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Client auto reply failed", error);
    return false;
  }
}

async function saveEnquiryToDashboard(env, enquiry) {
  if (!env.DASHBOARD_ENQUIRY_URL || !env.DASHBOARD_ENQUIRY_SECRET) {
    console.error("Dashboard enquiry capture is not configured");
    return false;
  }

  try {
    const response = await fetch(env.DASHBOARD_ENQUIRY_URL, {
      method: "POST",
      headers: {
        "authorization": `Bearer ${env.DASHBOARD_ENQUIRY_SECRET}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        externalId: enquiry.externalId,
        name: enquiry.name,
        email: enquiry.email,
        goal: enquiry.goal,
        message: enquiry.message,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || result?.ok !== true) {
      console.error("Dashboard enquiry capture was rejected", response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Dashboard enquiry capture failed", error);
    return false;
  }
}

async function handleEnquiry(request, env) {
  const origin = request.headers.get("origin");
  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
    return json({ error: "This enquiry could not be verified." }, 403);
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ error: "Invalid enquiry format." }, 415);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 20_000) {
    return json({ error: "This enquiry is too large." }, 413);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid enquiry format." }, 400);
  }

  const name = clean(payload.name, 80);
  const email = clean(payload.email, 160).toLowerCase();
  const goal = clean(payload.goal, 80);
  const message = clean(payload.message, 2000);
  const company = clean(payload.company, 120);
  const startedAt = Number(payload.startedAt);

  if (company) return json({ ok: true });
  if (!name || !validEmail(email) || !ALLOWED_GOALS.has(goal) || message.length < 10) {
    return json({ error: "Please complete every field with valid information." }, 400);
  }
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < 1500) {
    return json({ error: "Please take a moment to review your enquiry and try again." }, 400);
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeGoal = escapeHtml(goal);
  const safeMessage = escapeHtml(message).replaceAll("\n", "<br>");
  const subject = `[Jaraad Ramsey PT] ${goal} enquiry from ${name}`;

  try {
    await env.ENQUIRY_EMAIL.send({
      from: { email: "enquiries@jaraadramsey.com", name: "Jaraad Ramsey PT" },
      to: "jaraad05@gmail.com",
      replyTo: { email, name },
      subject,
      text: `New personal training enquiry\n\nName: ${name}\nEmail: ${email}\nGoal: ${goal}\n\nMessage:\n${message}`,
      html: `<h1>New personal training enquiry</h1><p><strong>Name:</strong> ${safeName}</p><p><strong>Email:</strong> ${safeEmail}</p><p><strong>Goal:</strong> ${safeGoal}</p><p><strong>Message:</strong><br>${safeMessage}</p>`,
    });

    const enquiry = { externalId: crypto.randomUUID(), name, email, goal, message };
    const [autoReplySent, dashboardSaved] = await Promise.all([
      sendClientAutoReply(env, enquiry),
      saveEnquiryToDashboard(env, enquiry),
    ]);
    return json({ ok: true, autoReplySent, dashboardSaved });
  } catch (error) {
    console.error("Enquiry email failed", error);
    return json({ error: "Email delivery is being configured. Please try again shortly." }, 503);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/personal-training" || url.pathname === "/personal-training.html") {
      url.pathname = "/";
      return Response.redirect(url, 308);
    }
    if (url.pathname === "/resume.html") {
      url.pathname = "/resume";
      return Response.redirect(url, 308);
    }
    if (url.pathname === "/api/enquiry") {
      if (request.method !== "POST") {
        return new Response(null, {
          status: 405,
          headers: { allow: "POST", "cache-control": "no-store" },
        });
      }
      return handleEnquiry(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

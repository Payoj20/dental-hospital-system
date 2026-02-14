export function scheduleTemplate(name: string, date: string, doctor: string) {
  return `
    <h2>Appointment Confirmed</h2>
    <p>Hello ${name},</p>
    <p>Your appointment with <b>${doctor}</b> is confirmed for:</p>
    <h3>${date}</h3>
    <p>Thank you for choosing DentalCare.</p>
  `;
}

export function reminderTemplate(name: string, date: string, doctor: string) {
  return `
    <h2>Appointment Reminder</h2>
    <p>Hello ${name},</p>
    <p>This is a reminder for your appointment with <b>${doctor}</b> after 15 minutes.</p>
    <h3>${date}</h3>
  `;
}

export function completedTemplate(name: string) {
  return `
    <h2>Visit Completed</h2>
    <p>Hello ${name},</p>
    <p>Your appointment has been completed.</p>
    <p>We hope you had a great experience.</p>
  `;
}

export function cancelledTemplate(name: string, date: string, doctor: string) {
  return `
    <h2>Appointment Cancelled</h2>
    <p>Hello ${name},</p>
    <p>Your appointment with <b>${doctor}</b> scheduled for:</p>
    <h3>${date}</h3>
    <p>has been cancelled.</p>
    <p>If you’d like to reschedule, please visit DentalCare.</p>
  `;
}

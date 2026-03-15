import nodemailer from 'nodemailer';
import { readData } from './actions';
import { SystemConfig, User } from './types';

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  const config = await readData<SystemConfig>('config.json');
  const emailConfig = config.emailConfig;

  if (!emailConfig || !emailConfig.smtpHost) {
    console.warn('Email skipped: Servidor SMTP no configurado.');
    return { success: false, message: 'SMTP not configured' };
  }

  const transporter = nodemailer.createTransport({
    host: emailConfig.smtpHost,
    port: emailConfig.smtpPort || 587,
    secure: emailConfig.smtpPort === 465,
    auth: {
      user: emailConfig.smtpUser,
      pass: emailConfig.smtpPassword,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: emailConfig.fromEmail || '"PortPilot" <noreply@portpilot.test>',
      to,
      subject,
      text,
      html,
    });
    console.log('Email enviado: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error enviando email:', error);
    return { success: false, error };
  }
}

/**
 * Substituye los marcadores {{placeholder}} por sus valores reales.
 */
function renderTemplate(template: string, data: Record<string, any>) {
  let rendered = template;
  Object.keys(data).forEach(key => {
    const value = data[key];
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, String(value || ''));
  });
  return rendered;
}

/**
 * Notifica a un usuario por email si tiene habilitada la preferencia correspondiente,
 * utilizando una plantilla personalizable si está disponible.
 */
export async function notifyUserIfEnabled(
  user: User,
  preference: keyof import('./types').NotificationPreferences,
  data: Record<string, any>
) {
  const globalConfig = await readData<SystemConfig>('config.json');
  
  // 1. Check global setting (if enabled by admin)
  const isGloballyEnabled = globalConfig.defaultNotificationPreferences?.[preference] !== false;
  
  // 2. Check user setting (defaults to true if not set)
  const isUserEnabled = user.preferences?.[preference] !== false;

  if (isGloballyEnabled && isUserEnabled) {
    try {
      const templates = await readData<import('./types').EmailTemplate[]>('email-templates.json');
      const template = templates.find(t => t.id === preference);

      if (template) {
        const subject = renderTemplate(template.subject, data);
        const html = renderTemplate(template.bodyHtml, data);
        // Generamos una versión de texto plano básica a partir del HTML si no se provee
        const text = html.replace(/<[^>]*>?/gm, ''); 

        return await sendEmail({ to: user.email, subject, text, html });
      } else {
        // Fallback for types that might not have a template yet
        console.warn(`Template not found for preference: ${preference}. Using default data.`);
        return await sendEmail({ 
          to: user.email, 
          subject: String(data.subject || 'Notificación de PortPilot'),
          text: String(data.text || ''),
          html: String(data.html || '')
        });
      }
    } catch (error) {
      console.error('Error rendering email template:', error);
      // Fallback on error
      return await sendEmail({ 
        to: user.email, 
        subject: String(data.subject || 'Notificación'),
        text: String(data.text || ''),
        html: String(data.html || '')
      });
    }
  }

  return { success: false, message: 'Notificaciones deshabilitadas por el usuario o globalmente.' };
}

/**
 * Notifica a todos los administradores o roles específicos.
 */
export async function notifyRoles(
  roles: import('./types').UserRole[],
  preference: keyof import('./types').NotificationPreferences,
  data: Record<string, any>
) {
  const allUsers = await readData<User[]>('users.json');
  const targetUsers = allUsers.filter(u => u.roles.some(r => roles.includes(r)));
  
  const results = [];
  for (const user of targetUsers) {
    const res = await notifyUserIfEnabled(user, preference, data);
    results.push({ email: user.email, ...res });
  }
  return results;
}

'use strict';

/**
 * scripts/notify.js
 *
 * Envia um e-mail ao final da execução do pipeline CI/CD.
 */

const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT = '587',
  SMTP_USER,
  SMTP_PASS,
  NOTIFY_EMAIL,
  TEST_STATUS   = 'unknown',
  BUILD_STATUS  = 'unknown',
  DEPLOY_STATUS = 'skipped',
  RUN_URL       = '',
  BRANCH        = 'unknown',
  COMMIT_SHA    = '',
  COMMIT_MSG    = '',
} = process.env;

const STATUS_ICON = {
  success:   '✅',
  failure:   '❌',
  cancelled: '🚫',
  skipped:   '⏭️',
  unknown:   '❓',
};

function icon(status) {
  return STATUS_ICON[status] ?? STATUS_ICON.unknown;
}

function overallResult() {
  const criticalJobs = [TEST_STATUS, BUILD_STATUS];
  if (criticalJobs.includes('failure'))   return 'FALHOU ❌';
  if (criticalJobs.includes('cancelled')) return 'CANCELADO 🚫';
  return 'PASSOU ✅';
}

const subject = `[Pokecards API] Pipeline ${overallResult()} — branch: ${BRANCH}`;

const shortSha = COMMIT_SHA.slice(0, 7);

const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<body style="font-family: Arial, sans-serif; color: #333; max-width: 620px; margin: auto; padding: 16px;">

  <h2 style="border-bottom: 2px solid #0366d6; padding-bottom: 8px; margin-bottom: 16px;">
    Resultado do Pipeline CI/CD
    <br>
    <small style="font-size: 14px; color: #666;">Pokecards Trading API</small>
  </h2>

  <table border="1" cellpadding="10" cellspacing="0"
         style="border-collapse: collapse; width: 100%; margin-bottom: 16px;">
    <thead>
      <tr style="background: #f6f8fa;">
        <th style="text-align: left; width: 50%;">Job</th>
        <th style="text-align: left;">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Testes Unitários</td>
        <td>${icon(TEST_STATUS)} <strong>${TEST_STATUS}</strong></td>
      </tr>
      <tr>
        <td>Build</td>
        <td>${icon(BUILD_STATUS)} <strong>${BUILD_STATUS}</strong></td>
      </tr>
      <tr>
        <td>Deploy (Railway)</td>
        <td>${icon(DEPLOY_STATUS)} <strong>${DEPLOY_STATUS}</strong></td>
      </tr>
    </tbody>
  </table>

  <table cellpadding="6" cellspacing="0" style="width: 100%; margin-bottom: 16px;">
    <tr>
      <td style="width: 100px;"><strong>Branch:</strong></td>
      <td><code>${BRANCH}</code></td>
    </tr>
    <tr>
      <td><strong>Commit:</strong></td>
      <td><code>${shortSha}</code>${COMMIT_MSG ? ` — ${COMMIT_MSG}` : ''}</td>
    </tr>
  </table>

  ${RUN_URL ? `
  <p>
    <a href="${RUN_URL}"
       style="background: #0366d6; color: white; padding: 10px 18px;
              border-radius: 4px; text-decoration: none; display: inline-block;">
      Ver execução no GitHub Actions
    </a>
  </p>` : ''}

</body>
</html>
`;

async function main() {
  if (!NOTIFY_EMAIL) {
    console.error('[notify] NOTIFY_EMAIL não definido.');
    console.error('[notify] Configure-o como Variable no repositório GitHub Actions.');
    process.exit(0);
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: SMTP_PORT === '465',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Pokecards CI/CD" <${SMTP_USER}>`,
    to: NOTIFY_EMAIL,
    subject,
    html,
  });

  console.log(`[notify] E-mail enviado para ${NOTIFY_EMAIL}`);
  console.log(`[notify] Assunto: ${subject}`);
}

main().catch((err) => {
  console.error('[notify] Erro ao enviar e-mail:', err.message);
  process.exit(0);
});

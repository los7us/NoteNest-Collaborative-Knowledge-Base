const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1, // Standard desktop
    });
    const page = await context.newPage();

    const outDir = 'c:\\Users\\anant\\OneDrive\\Desktop\\prms\\open\\NoteNest_PR_Screenshots';
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    try {
        console.log('Navigating to signup...');
        await page.goto('http://localhost:3000/signup');

        // Create new user (guarantees a clean state)
        const ts = Date.now();
        await page.fill('input[type="text"]', `PR Tester ${ts}`);
        await page.fill('input[type="email"]', `pr_${ts}@example.com`);

        const pwInputs = await page.$$('input[type="password"]');
        await pwInputs[0].fill('Password123!');
        await pwInputs[1].fill('Password123!');

        await page.click('button[type="submit"]');
        console.log('Signed up!');

        // Wait for redirect to dashboard
        await page.waitForTimeout(2000);
        await page.waitForURL('**/dashboard', { timeout: 10000 });

        console.log('Taking Dashboard screenshot...');
        await page.waitForTimeout(1000); // wait for animations
        await page.screenshot({ path: path.join(outDir, '1_dashboard.png'), fullPage: true });

        console.log('Changing Role to Admin for Management screenshot...');
        await page.selectOption('select#role-select', 'admin');
        await page.waitForTimeout(1000);

        console.log('Navigating to Management...');
        await page.goto('http://localhost:3000/management');
        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(outDir, '2_management.png'), fullPage: true });

        console.log('Extracting Workspace ID from Sidebar...');
        // Wait for the Home link to be populated with the active workspace ID
        await page.waitForSelector('text=Home');
        const homeHref = await page.getAttribute('text=Home', 'href');
        // href looks like /workspace/12345
        const workspaceId = homeHref.split('/')[2];

        if (!workspaceId) {
            console.log('No workspace found for the user!');
            return;
        }

        console.log(`Navigating to Settings for ${workspaceId}...`);
        await page.goto(`http://localhost:3000/workspace/${workspaceId}/settings`);
        await page.waitForTimeout(2000);

        console.log('Taking Settings screenshot...');
        await page.screenshot({ path: path.join(outDir, '3_workspace_settings.png'), fullPage: true });

        console.log('Creating invite...');
        let inviteToken = '';

        page.on('response', async (response) => {
            if (response.url().includes(`/api/workspaces/${workspaceId}/invites`) && response.request().method() === 'GET') {
                try {
                    const json = await response.json();
                    if (json && json.length > 0) {
                        inviteToken = json[0].token;
                    }
                } catch (e) { }
            }
        });

        await page.fill('input[type="email"]', `invite_${ts}@example.com`);
        await page.selectOption('select', 'commenter');
        await page.click('button:has-text("Send Invite")');
        await page.waitForTimeout(2000);

        await page.screenshot({ path: path.join(outDir, '4_workspace_settings_with_invite.png'), fullPage: true });

        if (!inviteToken) {
            console.log('Invite token not caught via network, check network logging.');
        }

        if (inviteToken) {
            console.log(`Taking Invite Acceptance screenshot for token ${inviteToken}...`);
            const inviteContext = await browser.newContext({
                viewport: { width: 1920, height: 1080 },
                deviceScaleFactor: 1,
            });
            const invitePage = await inviteContext.newPage();
            await invitePage.goto(`http://localhost:3000/invite/${inviteToken}`);
            await invitePage.waitForTimeout(1500);
            await invitePage.screenshot({ path: path.join(outDir, '5_invite_acceptance.png'), fullPage: true });
            await inviteContext.close();
        } else {
            console.log('Could not obtain invite token for screenshot.');
        }

        console.log('All screenshots captured successfully!');
    } catch (error) {
        console.error('Error during screenshot generation:', error);
    } finally {
        await browser.close();
    }
})();

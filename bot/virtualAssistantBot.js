const { ActivityHandler } = require('botbuilder');
// const { WaterfallDialog, WaterfallStepContext, ChoicePrompt, TextPrompt, DialogTurnStatus } = require('botbuilder-dialogs');
const { MainDialog } = require('../dialogs/unblockbot/mainDialog');

const { en } = require('../locale/en');
const { fr } = require('../locale/fr');

class VirtualAssistantBot extends ActivityHandler {
    constructor(conversationState, userState, dialogSet) {
        super();

        if (!conversationState) throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[DialogBot]: Missing parameter. userState is required');
        if (!dialogSet) throw new Error('[DialogBot]: Missing parameter. dialogSet is required');

        // Initialise private members for the bot
        this.conversationState = conversationState;
        this.userState = userState;
        this.dialogSet = dialogSet;
        this.locale = en;

        // Add the main dialog to the dialog set for the bot
        this.addDialogs();

        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            // Create DialogContext for the current turn
            const dc = await this.dialogSet.createContext(context);

            // Try to continue executing an active multi-turn dialog
            // const result = await dc.continueDialog();
            await dc.continueDialog();

            // If we want to rerun the dialog after it has finished we would uncomment the following
            // for now - once the main dialog has run the bot just ignores all incoming messages
            // TODO: is that really the behaviour we want though?
            /*
            if (result.status == DialogTurnStatus.empty && dc.context.activity.type == ActivityTypes.Message) {
                await dc.beginDialog('help');
            }
            */

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        // This function runs when a new member is added to the
        // converation with the bot
        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const locale = context.activity.locale.toLocaleLowerCase();
            if (locale === 'fr-ca' || locale === 'fr-fr') {
                this.locale = fr;
            }
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    // Send the welcome message
                    await context.sendActivity(this.locale.hello);
                    // Create DialogContext for the current turn
                    const dc = await this.dialogSet.createContext(context);
                    // Begin the dialog
                    await dc.beginDialog('MAIN_DIALOG');
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    addDialogs() {
        var mainDialog = new MainDialog();

        this.dialogSet.add(mainDialog);

        /*
        this.dialogSet.add(new WaterfallDialog('help',[
            async (step) => {
                const choices = ['yes', 'no'];
                const options = {
                    prompt: "What is it?",
                    choices,
                };
                return await step.prompt("choicePrompt", options);
            },
            async (step) => {
                switch (step.result.index) {
                    case 0:
                        await step.context.sendActivity("You picked yes!");
                    break;
                    case 1:
                        await step.context.sendActivity("You picked no!");
                    break;
                    default:
                        await step.context.sendActivity("I don't know what you picked");
                    break;
                }
                return await step.endDialog();
            }
        ]));
        this.dialogSet.add(new ChoicePrompt("choicePrompt"));
        */
    }

    /**
     * Override the ActivityHandler.run() method to save state changes after the bot logic completes.
     */
    async run(context) {
        await super.run(context);

        // Save any state changes. The load happened during the execution of the Dialog.
        await this.userState.saveChanges(context, false);
        await this.conversationState.saveChanges(context, false);
    }
}

module.exports.VirtualAssistantBot = VirtualAssistantBot;

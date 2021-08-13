const {
    TextPrompt,
    ComponentDialog,
    WaterfallDialog,
    ChoiceFactory,
} = require('botbuilder-dialogs');

const { LuisRecognizer } = require('botbuilder-ai');

const TEXT_PROMPT = 'TEXT_PROMPT';
const CONFIRM_LOOK_INTO_STEP = 'CONFIRM_LOOK_INTO_STEP';
const CONFIRM_LOOK_INTO_WATERFALL_STEP = 'CONFIRM_LOOK_INTO_STEP';

const MAX_ERROR_COUNT = 3;

class ConfirmLookIntoStep extends ComponentDialog {
    constructor() {
        super(CONFIRM_LOOK_INTO_STEP);

        // Add a text prompt to the dialog stack
        this.addDialog(new TextPrompt(TEXT_PROMPT));

        this.addDialog(new WaterfallDialog(CONFIRM_LOOK_INTO_WATERFALL_STEP, [
            this.initialStep.bind(this),
            this.finalStep.bind(this)
        ]));

        this.initialDialogId = CONFIRM_LOOK_INTO_WATERFALL_STEP;

        /*
        this.addDialog(new WaterfallDialog(CONFIRM_LOOK_INTO_WATERFALL_STEP,[
            async (step) => {
                const choices = ['yes', 'no'];
                const options = {
                    prompt: "What is it from Confirm look into step?",
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
        this.addDialog(new ChoicePrompt("choicePrompt"));
        */
    }

    /**
     * Initial step in the waterfall. This will kick of the ConfirmLookIntoStep step
     *
     * If the confirmLookIntoStep flag is set in the state machine then we can just
     * end this whole dialog
     *
     * If the confirmLookIntoStep flag is set to null then we need to get a response from the user
     *
     * If the user errors out then we're going to set the flag to false and assume they can't / don't
     * want to proceed
     */
    async initialStep(stepContext) {
        // Get the user details / state machine
        const unblockBotDetails = stepContext.options;

        // DEBUG
        console.log('DEBUG UNBLOCKBOTDETAILS:', unblockBotDetails.errorCount.confirmLookIntoStep);

        // Set the text for the prompt
        const standardMsg = 'I looked at your application and I can see there’s a block on your file. Do you want me to look into that?';

        // Set the text for the retry prompt
        const retryMsg = 'Sorry, do you want me to take a look at your file?';

        // Check if the error count is greater than the max threshold
        if (unblockBotDetails.errorCount.confirmLookIntoStep >= MAX_ERROR_COUNT) {
            // Throw the master error flag
            unblockBotDetails.masterError = true;

            // Set master error message to send
            const errorMsg = 'Sorry Mary, I’m not able to help you.'

            // Send master error message
            await stepContext.context.sendActivity(errorMsg);

            // End the dialog and pass the updated details state machine
            return await stepContext.endDialog(unblockBotDetails);
        }

        // Check the user state to see if unblockBotDetails.confirm_look_into_step is set to null or -1
        // If it is in the error state (-1) or or is set to null prompt the user
        // If it is false the user does not want to proceed
        if (unblockBotDetails.confirmLookIntoStep === null || unblockBotDetails.confirmLookIntoStep === -1) {
            // Setup the prompt message
            var promptMsg = standardMsg;

            // The current step is an error state
            if (unblockBotDetails.confirmLookIntoStep === -1) {
                promptMsg = retryMsg;
            }

            const promptOptions = ['Yes please!', 'No thanks'];

            const promptDetails = {
                prompt: ChoiceFactory.forChannel(stepContext.context, promptOptions, promptMsg),
            };

            return await stepContext.prompt(TEXT_PROMPT, promptDetails);
        }
        else {
            return await stepContext.next(false);
        }
    }

    /**
     * Validation step in the waterfall.
     * We use LUIZ to process the prompt reply and then
     * update the state machine (unblockBotDetails)
     */
    async finalStep(stepContext) {
        // Get the user details / state machine
        const unblockBotDetails = stepContext.options;

        // TODO: Check language and then change LUIZ appID

        // LUIZ Recogniser processing
        const recognizer = new LuisRecognizer({
            applicationId: process.env.LuisAppId,
            endpointKey: process.env.LuisAPIKey,
            endpoint: `https://${ process.env.LuisAPIHostName }.api.cognitive.microsoft.com`
        }, {
            includeAllIntents: true,
            includeInstanceData: true
        }, true);

        // Call prompts recognizer
        const recognizerResult = await recognizer.recognize(stepContext.context);

        // Top intent tell us which cognitive service to use.
        const intent = LuisRecognizer.topIntent(recognizerResult, 'None', 0.50);

        const closeMsg = 'Ok, no problem. Let me know if you change your mind!';

        switch (intent) {
        // Proceed
        case 'confirmChoicePositive':
            console.log('INTENT: ', intent);
            unblockBotDetails.confirmLookIntoStep = true;
            return await stepContext.endDialog(unblockBotDetails);

        // Don't Proceed
        case 'confirmChoiceNegative':
            console.log('INTENT: ', intent);

            await stepContext.context.sendActivity(closeMsg);
            
            unblockBotDetails.confirmLookIntoStep = false;
            return await stepContext.endDialog(unblockBotDetails);

        // Could not understand / None intent
        default: {
            // Catch all
            console.log('NONE INTENT');
            unblockBotDetails.confirmLookIntoStep = -1;
            unblockBotDetails.errorCount.confirmLookIntoStep++;

            return await stepContext.replaceDialog(CONFIRM_LOOK_INTO_STEP, unblockBotDetails);
        }
        }
    }
}

module.exports.ConfirmLookIntoStep = ConfirmLookIntoStep;
module.exports.CONFIRM_LOOK_INTO_STEP = CONFIRM_LOOK_INTO_STEP;

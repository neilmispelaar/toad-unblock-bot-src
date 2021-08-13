const {
    TextPrompt,
    ComponentDialog,
    WaterfallDialog,
    ChoiceFactory,
} = require('botbuilder-dialogs');

const { LuisRecognizer } = require('botbuilder-ai');

const TEXT_PROMPT = 'TEXT_PROMPT';
const CONFIRM_SEND_EMAIL_STEP = 'CONFIRM_SEND_EMAIL_STEP';
const CONFIRM_SEND_EMAIL_STEP_WATERFALL_STEP = 'CONFIRM_SEND_EMAIL_STEP_WATERFALL_STEP';

const MAX_ERROR_COUNT = 3;

class ConfirmSendEmailStep extends ComponentDialog {
    constructor() {
        super(CONFIRM_SEND_EMAIL_STEP);

        // Add a text prompt to the dialog stack
        this.addDialog(new TextPrompt(TEXT_PROMPT));

        this.addDialog(new WaterfallDialog(CONFIRM_SEND_EMAIL_STEP_WATERFALL_STEP, [
            this.initialStep.bind(this),
            this.finalStep.bind(this)
        ]));

        this.initialDialogId = CONFIRM_SEND_EMAIL_STEP_WATERFALL_STEP;
    }

    /**
     * Initial step in the waterfall. This will kick of the ConfirmLookIntoStep step
     *
     * If the confirmSendEmailStep flag is set in the state machine then we can just
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
        console.log('DEBUG UNBLOCKBOTDETAILS:', unblockBotDetails.errorCount.confirmSendEmailStep);

        // Set the text for the initial message
        const standardMsg = 'So, I can see that you completed your application on February 12, and the application itself looks good. However, we still haven’t received a Record of Employment from your previous employer, Initech.';

        // Set the text for the prompt
        const queryMsg = 'If you like, I can send Initech a follow-up email from the Government of Canada. That usually does the trick 😉';

        // Set the text for the retry prompt
        const retryMsg = 'Sorry, do you want me to send an email to your former employer?';

        // Check if the error count is greater than the max threshold
        if (unblockBotDetails.errorCount.confirmSendEmailStep >= MAX_ERROR_COUNT) {
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
        if (unblockBotDetails.confirmSendEmailStep === null || unblockBotDetails.confirmSendEmailStep === -1) {
            // TODO: Refactor this - has to be a better way
            // If the flag is set to null then the step hasn't run before
            if (unblockBotDetails.confirmSendEmailStep === null) {
                await stepContext.context.sendActivity(standardMsg);
            }

            // Setup the prompt message
            var promptMsg = '';

            // The current step is an error state
            if (unblockBotDetails.confirmSendEmailStep === -1) {
                promptMsg = retryMsg;
            }
            else {
                promptMsg = queryMsg;
            }

            //const promptOptions = ['Yes, email my former employer', 'No, don\'t email my former employer'];

            const promptOptions = ['Yes, send email', 'No, don\'t send email'];

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

        // This message is sent if the user selects that they don't want to continue
        const closeMsg = "Ok, no problem. I'll be here if you need me!";

        switch (intent) {
        // Proceed
        case 'confirmChoicePositive':
        case 'promptConfirmSendEmail':
            console.log('INTENT: ', intent);
            unblockBotDetails.confirmSendEmailStep = true;
            return await stepContext.endDialog(unblockBotDetails);

            // Don't Proceed
        case 'confirmChoiceNegative':
        case 'promptConfirmDontSendEmail':
            console.log('INTENT: ', intent);
            unblockBotDetails.confirmSendEmailStep = false;

            await stepContext.context.sendActivity(closeMsg);

            return await stepContext.endDialog(unblockBotDetails);

            // Could not understand / None intent
        default: {
            // Catch all
            console.log('NONE INTENT');
            unblockBotDetails.confirmSendEmailStep = -1;
            unblockBotDetails.errorCount.confirmSendEmailStep++;

            return await stepContext.replaceDialog(CONFIRM_SEND_EMAIL_STEP, unblockBotDetails);
        }
        }
    }
}

module.exports.ConfirmSendEmailStep = ConfirmSendEmailStep;
module.exports.CONFIRM_SEND_EMAIL_STEP = CONFIRM_SEND_EMAIL_STEP;

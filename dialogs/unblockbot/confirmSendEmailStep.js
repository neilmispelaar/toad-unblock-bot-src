const {
    TextPrompt,
    ComponentDialog,
    WaterfallDialog
} = require('botbuilder-dialogs');

const { LuisRecognizer } = require('botbuilder-ai');

const TEXT_PROMPT = 'TEXT_PROMPT';
const CONFIRM_SEND_EMAIL_STEP = 'CONFIRM_SEND_EMAIL_STEP';
const CONFIRM_SEND_EMAIL_STEP_WATERFALL_STEP = 'CONFIRM_SEND_EMAIL_STEP_WATERFALL_STEP';

const MAX_ERROR_COUNT = 3;

const { en } = require('../../locale/en');
const { fr } = require('../../locale/fr');

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
        this.locale = en;
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
        const locale = stepContext.context.activity.locale.toLocaleLowerCase();
        if (locale === 'fr-ca' || locale === 'fr-fr') {
            this.locale = fr;
        }
        // Get the user details / state machine
        const unblockBotDetails = stepContext.options;

        // DEBUG
        console.log('DEBUG UNBLOCKBOTDETAILS:', unblockBotDetails.errorCount.confirmSendEmailStep);

        // Set the text for the initial message
        const standardMsg = this.locale.confirmSendEmailStep;

        // Set the text for the prompt
        const queryMsg = this.locale.confirmSendEmailStepQuery;

        // Set the text for the retry prompt
        const retryMsg = this.locale.confirmSendEmailStepRetry;

        // Check if the error count is greater than the max threshold
        if (unblockBotDetails.errorCount.confirmSendEmailStep >= MAX_ERROR_COUNT) {
            // Throw the master error flag
            unblockBotDetails.masterError = true;
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
            } else {
                promptMsg = queryMsg;
            }

            return await stepContext.prompt(TEXT_PROMPT, promptMsg);
        } else {
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

        switch (intent) {
        // Proceed
        case 'confirmChoicePositive':
            console.log('INTENT: ', intent);
            unblockBotDetails.confirmSendEmailStep = true;
            return await stepContext.endDialog(unblockBotDetails);

            // Don't Proceed
        case 'confirmChoiceNegative':
            console.log('INTENT: ', intent);
            unblockBotDetails.confirmSendEmailStep = false;

            stepContext.context.sendActivity(this.locale.confirmSendEmailStepClose);

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

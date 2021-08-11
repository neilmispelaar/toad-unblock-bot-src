const {
    TextPrompt,
    ComponentDialog,
    WaterfallDialog
} = require('botbuilder-dialogs');

const TEXT_PROMPT = 'TEXT_PROMPT';
const GET_AND_SEND_EMAIL_STEP = 'GET_AND_SEND_EMAIL_STEP';
const GET_AND_SEND_EMAIL_WATERFALL_STEP = 'GET_AND_SEND_EMAIL_WATERFALL_STEP';

const MAX_ERROR_COUNT = 3;

const { en } = require('../../locale/en');
const { fr } = require('../../locale/fr');

class GetAndSendEmailStep extends ComponentDialog {
    constructor() {
        super(GET_AND_SEND_EMAIL_STEP);

        // Add a text prompt to the dialog stack
        this.addDialog(new TextPrompt(TEXT_PROMPT));

        this.addDialog(new WaterfallDialog(GET_AND_SEND_EMAIL_WATERFALL_STEP, [
            this.initialStep.bind(this),
            this.finalStep.bind(this)
        ]));

        this.initialDialogId = GET_AND_SEND_EMAIL_WATERFALL_STEP;
        this.locale = en;
    }

    /**
     * Kick off the dialog by asking for an email address
     *
     */
    async initialStep(stepContext) {
        const locale = stepContext.context.activity.locale.toLocaleLowerCase();
        if (locale === 'fr-ca' || locale === 'fr-fr') {
            this.locale = fr;
        }
        // Get the user details / state machine
        const unblockBotDetails = stepContext.options;

        // DEBUG
        console.log('DEBUG UNBLOCKBOTDETAILS in GetAndSendEmailStep:', unblockBotDetails);

        // Set the text for the prompt
        const standardPromptMsg = this.locale.getAndSendEmailStep;

        // Set the text for the retry prompt
        const retryPromptMsg = this.locale.getAndSendEmailStepRetry;

        // Check if the error count is greater than the max threshold
        if (unblockBotDetails.errorCount.getAndSendEmailStep >= MAX_ERROR_COUNT) {
            // Throw the master error flag
            unblockBotDetails.masterError = true;
            // End the dialog and pass the updated details state machine
            return await stepContext.endDialog(unblockBotDetails);
        }

        // Check the user state to see if unblockBotDetails.getAndSendEmailStep is set to null or -1
        // If it is in the error state (-1) or or is set to null prompt the user
        // If it is false the user does not want to proceed
        if (unblockBotDetails.getAndSendEmailStep === null || unblockBotDetails.getAndSendEmailStep === -1) {
            // Setup the prompt message
            var promptMsg = '';

            // The current step is an error state
            if (unblockBotDetails.getAndSendEmailStep === -1) {
                promptMsg = retryPromptMsg;
            } else {
                promptMsg = standardPromptMsg;
            }

            return await stepContext.prompt(TEXT_PROMPT, promptMsg);
        } else {
            return await stepContext.next(false);
        }
    }

    /**
     *
     *
     */
    async finalStep(stepContext) {
        // Get the user details / state machine
        const unblockBotDetails = stepContext.options;

        // Result has come through
        if (stepContext.result) {
            await stepContext.context.sendActivity(this.locale.getAndSendEmailStepConfirm);
            return await stepContext.endDialog(unblockBotDetails);
        } else {
            // No result provided
            unblockBotDetails.getAndSendEmailStep = -1;
            unblockBotDetails.errorCount.getAndSendEmailStep++;

            return await stepContext.replaceDialog(GET_AND_SEND_EMAIL_STEP, unblockBotDetails);
        }
    }
}

module.exports.GetAndSendEmailStep = GetAndSendEmailStep;
module.exports.GET_AND_SEND_EMAIL_STEP = GET_AND_SEND_EMAIL_STEP;

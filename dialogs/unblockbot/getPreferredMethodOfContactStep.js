const {
    TextPrompt,
    ComponentDialog,
    WaterfallDialog,
} = require('botbuilder-dialogs');

const { LuisRecognizer } = require('botbuilder-ai');

const TEXT_PROMPT = 'TEXT_PROMPT';
const GET_PREFFERED_METHOD_OF_CONTACT_STEP = 'GET_PREFFERED_METHOD_OF_CONTACT_STEP';
const GET_PREFFERED_METHOD_OF_CONTACT_WATERFALL_STEP = 'GET_PREFFERED_METHOD_OF_CONTACT_WATERFALL_STEP';

const MAX_ERROR_COUNT = 3;

class GetPreferredMethodOfContactStep extends ComponentDialog {
    constructor() {
        super(GET_PREFFERED_METHOD_OF_CONTACT_STEP);

        // Add a text prompt to the dialog stack
        this.addDialog(new TextPrompt(TEXT_PROMPT));

        this.addDialog(new WaterfallDialog(GET_PREFFERED_METHOD_OF_CONTACT_WATERFALL_STEP, [
            this.initialStep.bind(this),
            this.finalStep.bind(this)
        ]));

        this.initialDialogId = GET_PREFFERED_METHOD_OF_CONTACT_WATERFALL_STEP;
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
        console.log('DEBUG UNBLOCKBOTDETAILS:', unblockBotDetails);

        // Set the text for the prompt
        const queryMsg = 'What\'s the best way to reach you? I can do email or text message (or both).';

        // Set the text for the retry prompt
        const retryMsg = 'Sorry, do you prefer email or text or both?';

        // Check if the error count is greater than the max threshold
        if (unblockBotDetails.errorCount.getPreferredMethodOfContactStep >= MAX_ERROR_COUNT) {
            // Throw the master error flag
            unblockBotDetails.masterError = true;
            // End the dialog and pass the updated details state machine
            return await stepContext.endDialog(unblockBotDetails);
        }

        // Check the user state to see if unblockBotDetails.confirm_look_into_step is set to null or -1
        // If it is in the error state (-1) or or is set to null prompt the user
        // If it is false the user does not want to proceed
        if (unblockBotDetails.getPreferredMethodOfContactStep === null || unblockBotDetails.getPreferredMethodOfContactStep === -1) {
            // Setup the prompt message
            var promptMsg = '';

            // The current step is an error state
            if (unblockBotDetails.getPreferredMethodOfContactStep === -1) {
                promptMsg = retryMsg;
            }
            else {
                promptMsg = queryMsg;
            }

            return await stepContext.prompt(TEXT_PROMPT, promptMsg);
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

        const emailMsg = 'Ok, we\'ll email you at mary@fakeaddress.com once we gotten your Record of Employment.';

        switch (intent) {
        // Proceed
        case 'confirmChoiceEmail':
            console.log('INTENT: ', intent);
            unblockBotDetails.getPreferredMethodOfContactStep = true;

            stepContext.context.sendActivity(emailMsg);

            return await stepContext.endDialog(unblockBotDetails);
        /*
        // TODO: ADD TEXT / PHONE OPTION
        // Don't Proceed
        case 'confirmChoiceNegative':
            console.log('INTENT: ', intent);
            unblockBotDetails.confirmSendEmailStep = false;

            stepContext.context.sendActivity(closeMsg);

            return await stepContext.endDialog(unblockBotDetails);
        */
        // Could not understand / None intent
        default: {
            // Catch all
            console.log('NONE INTENT');
            unblockBotDetails.getPreferredMethodOfContactStep = -1;
            unblockBotDetails.errorCount.getPreferredMethodOfContactStep++;

            return await stepContext.replaceDialog(GET_PREFFERED_METHOD_OF_CONTACT_STEP, unblockBotDetails);
        }
        }
    }
}

module.exports.GetPreferredMethodOfContactStep = GetPreferredMethodOfContactStep;
module.exports.GET_PREFFERED_METHOD_OF_CONTACT_STEP = GET_PREFFERED_METHOD_OF_CONTACT_STEP;
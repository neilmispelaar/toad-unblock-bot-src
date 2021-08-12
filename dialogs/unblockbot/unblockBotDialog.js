const {
    ComponentDialog,
    WaterfallDialog,
} = require('botbuilder-dialogs');

const { ConfirmLookIntoStep, CONFIRM_LOOK_INTO_STEP } = require('./confirmLookIntoStep');
const { ConfirmSendEmailStep, CONFIRM_SEND_EMAIL_STEP } = require('./confirmSendEmailStep');
const { GetAndSendEmailStep, GET_AND_SEND_EMAIL_STEP } = require('./getAndSendEmailStep');
const { ConfirmNotifyROEReceivedStep, CONFIRM_NOTIFY_ROE_RECEIVED_STEP } = require('./confirmNotifyROEReceivedStep');
const { GetPreferredMethodOfContactStep, GET_PREFFERED_METHOD_OF_CONTACT_STEP } = require('./getPreferredMethodOfContactStep');

const UNBLOCK_BOT_DIALOG = 'UNBLOCK_BOT_DIALOG';
const MAIN_UNBLOCK_BOT_WATERFALL_DIALOG = 'MAIN_UNBLOCK_BOT_WATERFALL_DIALOG';

class UnblockBotDialog extends ComponentDialog {
    constructor() {
        super(UNBLOCK_BOT_DIALOG);

        // Add the ConfirmLookIntoStep dialog to the dialog stack
        this.addDialog(new ConfirmLookIntoStep());
        this.addDialog(new ConfirmSendEmailStep());
        this.addDialog(new GetAndSendEmailStep());
        this.addDialog(new ConfirmNotifyROEReceivedStep());
        this.addDialog(new GetPreferredMethodOfContactStep());

        this.addDialog(new WaterfallDialog(MAIN_UNBLOCK_BOT_WATERFALL_DIALOG, [
            this.confirmLookIntoStep.bind(this),
            this.confirmSendEmailStep.bind(this),
            this.getAndSendEmailStep.bind(this),
            this.confirmNotifyROEReceivedStep.bind(this),
            this.getPreferredMethodOfContactStep.bind(this),
            this.finalStep.bind(this)
        ]));

        this.initialDialogId = MAIN_UNBLOCK_BOT_WATERFALL_DIALOG;
    }

    /**
     * Initial step in the waterfall. This will kick of the unblockbot dialog
     * Most of the time this will just kick off the CONFIRM_LOOK_INTO_STEP dialog -
     * But in the off chance that the bot has already run through the switch statement
     * will take care of edge cases
     */
    async confirmLookIntoStep(stepContext) {
        // Get the unblockbot details / state machine for the current user
        const unblockBotDetails = stepContext.options;

        // DEBUG
        console.log('DEBUG: unblockBotDetails:', unblockBotDetails);

        switch (unblockBotDetails.confirmLookIntoStep) {
        // The confirmLookIntoStep flag in the state machine isn't set
        // so we are sending the user to that step
        case null:
            return await stepContext.beginDialog(CONFIRM_LOOK_INTO_STEP, unblockBotDetails);

        // The confirmLookIntoStep flag in the state machine is set to true
        // so we are sending the user to next step
        case true:
            console.log('DEBUG', unblockBotDetails);
            return await stepContext.next(unblockBotDetails);

        // The confirmLookIntoStep flag in the state machine is set to false
        // so we are sending to the end because they don't want to continue
        case false:
            // code block
            return await stepContext.endDialog(unblockBotDetails);

        // Default catch all but we should never get here
        default:
            return await stepContext.endDialog(unblockBotDetails);
        }
    }

    /**
     * Second Step
     *
     */
    async confirmSendEmailStep(stepContext) {
        // Get the state machine from the last step
        const unblockBotDetails = stepContext.result;

        // DEBUG
        console.log('DEBUG: confirmSendEmailStep:', unblockBotDetails, stepContext.result);

        switch (unblockBotDetails.confirmSendEmailStep) {
        // The confirmLookIntoStep flag in the state machine isn't set
        // so we are sending the user to that step
        case null:
            if (unblockBotDetails.confirmLookIntoStep === true) {
                return await stepContext.beginDialog(CONFIRM_SEND_EMAIL_STEP, unblockBotDetails);
            }
            else {
                return await stepContext.endDialog(unblockBotDetails);
            }

        // The confirmLookIntoStep flag in the state machine is set to true
        // so we are sending the user to next step
        case true:
            return await stepContext.next();

        // The confirmLookIntoStep flag in the state machine is set to false
        // so we are sending to the end because they don't want to continue
        case false:
            return await stepContext.endDialog(unblockBotDetails);

        // Default catch all but we should never get here
        default:
            return await stepContext.endDialog(unblockBotDetails);
        }
    }

    /**
     * Third Step
     *
     */
    async getAndSendEmailStep(stepContext) {
        // Get the state machine from the last step
        const unblockBotDetails = stepContext.result;

        // DEBUG
        // console.log('DEBUG: getAndSendEmailStep:', unblockBotDetails, stepContext.result);

        switch (unblockBotDetails.getAndSendEmailStep) {
        // The confirmLookIntoStep flag in the state machine isn't set
        // so we are sending the user to that step
        case null:
            // ADD CHECKS TO SEE IF THE STATE FOR THE FIRST TWO STEPS IS TRUE 
            return await stepContext.beginDialog(GET_AND_SEND_EMAIL_STEP, unblockBotDetails);

        // The confirmLookIntoStep flag in the state machine is set to true
        // so we are sending the user to next step
        case true:
            console.log('DEBUG', unblockBotDetails);
            return await stepContext.next(unblockBotDetails);

        // The confirmLookIntoStep flag in the state machine is set to false
        // so we are sending to the end because they don't want to continue
        case false:
            // code block
            return await stepContext.endDialog(unblockBotDetails);

        // Default catch all but we should never get here
        default:
            return await stepContext.endDialog(unblockBotDetails);
        }
    }

    /**
     * Fourth Step
     *
     */
    async confirmNotifyROEReceivedStep(stepContext) {
        // Get the state machine from the last step
        const unblockBotDetails = stepContext.result;

        // DEBUG
        // console.log('DEBUG: getAndSendEmailStep:', unblockBotDetails, stepContext.result);

        switch (unblockBotDetails.confirmNotifyROEReceivedStep) {
        // The confirmNotifyROEReceivedStep flag in the state machine isn't set
        // so we are sending the user to that step
        case null:
            // ADD CHECKS TO SEE IF THE FIRST THREE STEPS ARE TRUE 
            // IF ANY STEPS WERE FALSE OR ANYTHING ELSE THAN JUST END DIALOG 
            return await stepContext.beginDialog(CONFIRM_NOTIFY_ROE_RECEIVED_STEP, unblockBotDetails);

        // The confirmNotifyROEReceivedStep flag in the state machine is set to true
        // so we are sending the user to next step
        case true:
            console.log('DEBUG', unblockBotDetails);
            return await stepContext.next(unblockBotDetails);

        // The confirmNotifyROEReceivedStep flag in the state machine is set to false
        // so we are sending to the end because they need to hit the next step
        case false:
            // code block
            return await stepContext.endDialog(unblockBotDetails);

        // Default catch all but we should never get here
        default:
            return await stepContext.endDialog(unblockBotDetails);
        }
    }

    /**
     * Fifth Step
     *
     */
    async getPreferredMethodOfContactStep(stepContext) {
        // Get the state machine from the last step
        const unblockBotDetails = stepContext.result;

        // DEBUG
        // console.log('DEBUG: getAndSendEmailStep:', unblockBotDetails, stepContext.result);

        switch (unblockBotDetails.getPreferredMethodOfContactStep) {
        // The GetPreferredMethodOfContactStep flag in the state machine isn't set
        // so we are sending the user to that step
        case null:
            if (unblockBotDetails.confirmNotifyROEReceivedStep === true) {
                return await stepContext.beginDialog(GET_PREFFERED_METHOD_OF_CONTACT_STEP, unblockBotDetails);
            }
            else {
                return await stepContext.endDialog(unblockBotDetails);
            }

        // The confirmNotifyROEReceivedStep flag in the state machine is set to true
        // so we are sending the user to next step
        case true:
            return await stepContext.next(unblockBotDetails);

        // The confirmNotifyROEReceivedStep flag in the state machine is set to false
        // so we are sending to the end because they need to hit the next step
        case false:
            // code block
            return await stepContext.endDialog(unblockBotDetails);

        // Default catch all but we should never get here
        default:
            return await stepContext.endDialog(unblockBotDetails);
        }
    }

    /**
     * Final step in the waterfall. This will end the unblockbot dialog
     */
    async finalStep(stepContext) {
        // Get the results of the last ran step
        const unblockBotDetails = stepContext.result;

        console.log('DEBUG DETAILS: ', unblockBotDetails);

        if (unblockBotDetails.masterError === true) {
            await stepContext.context.sendActivity("Well this is awkward. Looks like we're having some issues today...");
        }

        return await stepContext.endDialog(unblockBotDetails);
    }
}

module.exports.UnblockBotDialog = UnblockBotDialog;
module.exports.UNBLOCK_BOT_DIALOG = UNBLOCK_BOT_DIALOG;

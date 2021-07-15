// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { MessageFactory } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const {
    AttachmentPrompt,
    ChoiceFactory,
    ChoicePrompt,
    ComponentDialog,
    ConfirmPrompt,
    DialogSet,
    DialogTurnStatus,
    NumberPrompt,
    TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');
const { Channels } = require('botbuilder-core');
const { UserProfile } = require('./userProfile');

const ATTACHMENT_PROMPT = 'ATTACHMENT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const NAME_PROMPT = 'NAME_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const USER_PROFILE = 'USER_PROFILE';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class UnBlockBotDialog extends ComponentDialog {
    constructor(userState) {
        super('unBlockBotDialog');


        // this.userProfile = userState.createProperty(USER_PROFILE);
        // 

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new TextPrompt(NAME_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT, this.agePromptValidator));
        this.addDialog(new AttachmentPrompt(ATTACHMENT_PROMPT, this.picturePromptValidator));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.intentConfirmStep.bind(this),
            this.testintentConfirmStep.bind(this),
            this.lookintoConfirmStep.bind(this),
            this.roeEmployerLookIntoStep.bind(this),
            this.emailPromptStep.bind(this),
            this.emailProvidedStep.bind(this),
            this.notifyEmailStep.bind(this),
            this.emailStep.bind(this),
            this.closeStep.bind(this),      
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async intentConfirmStep(step) {

        console.log('Step:', step);
    
        // We can send messages to the user at any point in the WaterfallStep.
        return await step.prompt(TEXT_PROMPT, 'Would you like to proceed? Hi');
    
    }

    async testintentConfirmStep(step) {

        //console.log('Step:', step);

        //await step.context.sendActivity(`Checking LUIS... ${step.result}`);

        const recognizer = new LuisRecognizer({
            applicationId: process.env.LuisAppId,
            endpointKey: process.env.LuisAPIKey,
            endpoint: `https://${ process.env.LuisAPIHostName }.api.cognitive.microsoft.com`
        }, {
            includeAllIntents: true,
            includeInstanceData: true
        }, true);

        // Call prompts recognizer
        const recognizerResult = await recognizer.recognize(step.context);

        // Top intent tell us which cognitive service to use.
        const intent = LuisRecognizer.topIntent(recognizerResult);

        console.log("INTENT" , intent);

        await step.context.sendActivity(intent);

        /*
        recognizer.recognize(step.context, function (err, result) {
            // If the intent returned isn't the 'None' intent return it
            // as the prompts response.
            if (result && result.intent !== 'None') {

                // callback(null, result.score, result);
                

            } else {

                // callback(null, 0.0);
                console.log ("No intent recognised");

            }
        });
        */

        
        // Top intent tell us which cognitive service to use.
        // const intent = LuisRecognizer.topIntent(recognizerResult);



    
        // We can send messages to the user at any point in the WaterfallStep.
        return await step.next(-1);
    
    }

    async lookintoConfirmStep(step) {
        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
        const promptOptions = { 
            prompt: 'I looked at your application and I can see there’s a block on your file. Do you want me to look into that?', 
            retryPrompt: ['yes', 'no'],
        };

        console.log('Step:', step);

        return await step.prompt(CONFIRM_PROMPT, promptOptions);
    }

    async roeEmployerLookIntoStep(step) {
        
        
        
        if (step.result) {
            // User said "yes" so we will be prompting for the next thing.
            // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
            
            // We can send messages to the user at any point in the WaterfallStep.
            await step.context.sendActivity('So, I can see that you completed your application on February 12, and the application itself looks good. However, we still haven’t received a Record of Employment from your previous employer, (former employer).');

            const promptOptions = { 
                prompt: 'If you like, I can send (former employer) a follow-up email from the Government of Canada. That usually does the trick 😉', 
                retryPrompt: ['yes', 'no'] 
            };

            return await step.prompt(CONFIRM_PROMPT, promptOptions);

        } else {
            // User said "no" so we will skip the next step. Give -1 as the age.
            return await step.endDialog();
        }

    }

    async emailPromptStep(step) {
        if (step.result) {
            // User said "yes" so we will be prompting for the next thing.
            // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
            
            // We can send messages to the user at any point in the WaterfallStep.
            return await step.prompt(TEXT_PROMPT, 'Ok, what email address should I send it to?');

        } else {
            // User said "no" so we will skip the next step. Give -1 as the age.
            return await step.endDialog();
        }

    }

    async emailProvidedStep(step) {
        if (step.result) {
            // User said "yes" so we will be prompting for the next thing.
            // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
            console.log('Step data', step);
            step.values.email = step.result;

            await step.context.sendActivity(`Ok, email sent to ${step.values.email}`);
            
            // We can send messages to the user at any point in the WaterfallStep.
            const promptOptions = { 
                prompt: 'Do you want me to notify you when we’ve received the Record of Employment?', 
                retryPrompt: ['yes', 'no'] 
            };

            return await step.prompt(CONFIRM_PROMPT, promptOptions);

        } else {
            // User said "no" so we will skip the next step. Give -1 as the age.
            return await step.endDialog();
        }

    }

    async notifyEmailStep(step) {
        if (step.result) {
            // User said "yes" so we will be prompting for the next thing.
            // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
            
            // Running a prompt here means the next WaterfallStep will be run when the user's response is received.
            return await step.prompt(CHOICE_PROMPT, {
                prompt: 'What’s the best way to reach you? I can do email or text message (or both).',
                choices: ChoiceFactory.toChoices(['Email', 'Text', 'Both'])
            });
            

        } else {
            // User said "no" so we will skip the next step. Give -1 as the age.
            return await step.endDialog();
        }

    }

    async emailStep(step) {
        if (step.result) {
            // User said "yes" so we will be prompting for the next thing.
            // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
            console.log('Step data', step);
            
            step.values.type = step.result.value;

            if (step.values.type === 'Email') {

                await step.context.sendActivity("Ok, we'll email you at ___@____.com  once we gotten your Record of Employment.");

                // Running a prompt here means the next WaterfallStep will be run when the user's response is received.
                return await step.prompt(CHOICE_PROMPT, {
                    prompt: 'Before you go, could I ask you to rate the service you received today?',
                    choices: ChoiceFactory.toChoices(['😡', '🙁', '😐', '🙂', '😄'])  
                });

            }
            else {
                 // User said "no" so we will skip the next step. Give -1 as the age.
                return await step.endDialog();
            }
 

        } else {
            // User said "no" so we will skip the next step. Give -1 as the age.
            return await step.endDialog();
        }

    }

    async closeStep(step) {
        
        await step.context.sendActivity('Ok, have a great day!');

        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is the end.
        return await step.endDialog();

    }

}

module.exports.UnBlockBotDialog = UnBlockBotDialog;

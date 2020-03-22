/**
 * Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { FunctionComponent, useEffect, useState } from "react";
import { SettingsSectionIcons } from "../../configs";
import { AlertInterface, AlertLevels } from "../../models";
import { EditSection, Hint, Section } from "@wso2is/react-components";
import { useTranslation } from "react-i18next";
import { Button, Container, Divider, Form, Modal } from "semantic-ui-react";
import { Field, Forms, useTrigger } from "@wso2is/forms";
import { getSelfSignUpConfigurations, updateSelfSignUpConfigurations } from "../../api/user-self-registration";
import { SelfSignUpConfigurationsInterface } from "../../models/server-configurations";
import { addAlert } from "../../store/actions";
import { useDispatch } from "react-redux";

/**
 * Constant to store the self registration from identifier.
 * @type {string}
 */
const USER_SELF_REGISTRATION_FORM_IDENTIFIER = "userSelfRegistrationForm";

/**
 * Prop types for the change password component.
 */
interface UserSelfRegistrationProps {
	onAlertFired: (alert: AlertInterface) => void;
}

/**
 * Self registration API Key constants.
 */
const SELF_REGISTRATION_ENABLE = "SelfRegistration.Enable";
const ACCOUNT_LOCK_ON_CREATION = "SelfRegistration.LockOnCreation";
const NOTIFICATION_INTERNALLY_MANAGED = "SelfRegistration.Notification.InternallyManage";
const RE_CAPTCHA = "SelfRegistration.ReCaptcha";
const VERIFICATION_CODE_EXPIRY_TIME = "SelfRegistration.VerificationCode.ExpiryTime";
const SMS_OTP_EXPIRY_TIME = "SelfRegistration.VerificationCode.SMSOTP.ExpiryTime";
const CALLBACK_REGEX = "SelfRegistration.CallbackRegex";

/**
 * User Self Registration component.
 *
 * @param {UserSelfRegistrationProps} props - Props injected to the change password component.
 * @return {JSX.Element}
 */
export const UserSelfRegistration: FunctionComponent<UserSelfRegistrationProps> = (props: UserSelfRegistrationProps):
	JSX.Element => {

	const [editingForm, setEditingForm] = useState({
		[USER_SELF_REGISTRATION_FORM_IDENTIFIER]: false
	});

	const [selfSignUpConfigs, setSelfSignUpConfigs] = useState<SelfSignUpConfigurationsInterface>({});
	const [showConfirmationModal, setShowConfirmationModal] = useState(false);
	const [reset] = useTrigger();

	const dispatch = useDispatch();

	const {t} = useTranslation();

	/**
	 * Handles the `onSubmit` event of the forms.
	 */
	const handleSubmit = (): void => {
		setShowConfirmationModal(true);
	};

	/**
	 * Handle the confirmation modal close event.
	 */
	const handleConfirmationModalClose = (): void => {
		setShowConfirmationModal(false);
	};

	/**
	 * Handles the onClick event of the cancel button.
	 *
	 * @param formName - Name of the form
	 */
	const hideFormEditView = (formName: string): void => {
		setEditingForm({
			...editingForm,
			[formName]: false
		});
	};

	/**
	 * Handles the onClick event of the edit button.
	 *
	 * @param formName - Name of the form
	 */
	const showFormEditView = (formName: string): void => {
		setEditingForm({
			...editingForm,
			[formName]: true
		});
	};

	/**
	 * Create and return the PATCH request data by reading the form values.
	 */
	const getSelfSignUpPatchCallData = () => {
		return {
			"operation": "UPDATE",
			"properties": [
				{
					"name": SELF_REGISTRATION_ENABLE,
					"value": selfSignUpConfigs.checkboxValues.includes(SELF_REGISTRATION_ENABLE) ? "true" : "false"
				},
				{
					"name": ACCOUNT_LOCK_ON_CREATION,
					"value": selfSignUpConfigs.checkboxValues.includes(ACCOUNT_LOCK_ON_CREATION) ? "true" : "false"
				},
				{
					"name": NOTIFICATION_INTERNALLY_MANAGED,
					"value": selfSignUpConfigs.checkboxValues.includes(NOTIFICATION_INTERNALLY_MANAGED) ?
						"true" : "false"
				},
				{
					"name": RE_CAPTCHA,
					"value": selfSignUpConfigs.checkboxValues.includes(RE_CAPTCHA) ? "true" : "false"
				},
				{
					"name": VERIFICATION_CODE_EXPIRY_TIME,
					"value": selfSignUpConfigs.verificationCodeExpiryTime
				},
				{
					"name": SMS_OTP_EXPIRY_TIME,
					"value": selfSignUpConfigs.smsOTPExpiryTime
				},
				{
					"name": CALLBACK_REGEX,
					"value": selfSignUpConfigs.callbackRegex
				},
			]
		};
	};

	/**
	 * Calls the API and updates the self registrations configurations.
	 */
	const saveSelfRegistrationConfigs = () => {
		const data = getSelfSignUpPatchCallData();
		updateSelfSignUpConfigurations(data)
			.then(() => {
				dispatch(addAlert({
					description: t(
						"views:components.serverConfigs.selfRegistration.notifications.updateConfigurations." +
						"success.description"
					),
					level: AlertLevels.SUCCESS,
					message: t(
						"views:components.serverConfigs.selfRegistration.notifications.updateConfigurations." +
						"success.message"
					)
				}));
				handleConfirmationModalClose();
				hideFormEditView(USER_SELF_REGISTRATION_FORM_IDENTIFIER);
			})
			.catch((error) => {
				// Axios throws a generic `Network Error` for 401 status.
				// As a temporary solution, a check to see if a response is available has been used.
				if (!error.response || error.response.status === 401) {
					dispatch(addAlert({
						description: t(
							"views:components.serverConfigs.selfRegistration.notifications.updateConfigurations." +
							"error.description"
						),
						level: AlertLevels.ERROR,
						message: t(
							"views:components.serverConfigs.selfRegistration.notifications.updateConfigurations." +
							"error.message"
						)
					}));
				} else if (error.response && error.response.data && error.response.data.detail) {

					dispatch(addAlert({
						description: t(
							"views:components.serverConfigs.selfRegistration.notifications.updateConfigurations." +
							"error.description",
							{description: error.response.data.detail}
						),
						level: AlertLevels.ERROR,
						message: t(
							"views:components.serverConfigs.selfRegistration.notifications.updateConfigurations." +
							"error.message"
						)
					}));
				} else {
					// Generic error message
					dispatch(addAlert({
						description: t(
							"views:components.serverConfigs.selfRegistration.notifications.updateConfigurations." +
							"genericError.description"
						),
						level: AlertLevels.ERROR,
						message: t(
							"views:components.serverConfigs.selfRegistration.notifications.updateConfigurations." +
							"genericError.message"
						)
					}));
				}
			});
	};

	/**
	 * Load self registration configurations from the API, on page load.
	 */
	useEffect(() => {
		getSelfSignUpConfigurations()
			.then((response) => {
				const checkboxValues = getSelfRegistrationCheckboxValues(response);
				const configs = {
					checkboxValues: checkboxValues,
					verificationCodeExpiryTime: response.properties.find(
						property => property.name == VERIFICATION_CODE_EXPIRY_TIME).value,
					smsOTPExpiryTime: response.properties.find(
						property => property.name == SMS_OTP_EXPIRY_TIME).value,
					callbackRegex: response.properties.find(
						property => property.name == CALLBACK_REGEX).value
				};
				setSelfSignUpConfigs(configs);
			});
	}, []);

	/**
	 * Loop through the properties array of the API response and extract the checkbox values.
	 *
	 * @param data API Response data.
	 * @return String array. Ex: [ "Enable", "LockOnCreation", ...]
	 */
	const getSelfRegistrationCheckboxValues = (data) => {
		const values = [];
		data.properties.map((property => {
			if (property.name === SELF_REGISTRATION_ENABLE) {
				property.value === "true" ? values.push(SELF_REGISTRATION_ENABLE) : "";
			}
			if (property.name === ACCOUNT_LOCK_ON_CREATION) {
				property.value === "true" ? values.push(ACCOUNT_LOCK_ON_CREATION) : "";
			}
			if (property.name === NOTIFICATION_INTERNALLY_MANAGED) {
				property.value === "true" ? values.push(NOTIFICATION_INTERNALLY_MANAGED) : "";
			}
			if (property.name === RE_CAPTCHA) {
				property.value === "true" ? values.push(RE_CAPTCHA) : "";
			}
		}));
		return values;
	};

	const confirmationModal = (
		<Modal size="mini" open={ showConfirmationModal } onClose={ handleConfirmationModalClose } dimmer="blurring">
			<Modal.Content>
				<Container>
					<h3>{ t("views:components.serverConfigs.selfRegistration.confirmation.heading") }</h3>
				</Container>
				<Divider hidden={ true }/>
				<p>{ t("views:components.serverConfigs.selfRegistration.confirmation.message") }</p>
			</Modal.Content>
			<Modal.Actions>
				<Button className="link-button" onClick={ handleConfirmationModalClose }>
					{ t("common:cancel") }
				</Button>
				<Button primary={ true } onClick={ saveSelfRegistrationConfigs }>
					{ t("common:continue") }
				</Button>
			</Modal.Actions>
		</Modal>
	);

	const getFormValues = (values) => {
		console.log(values);
		return {
			checkboxValues: values.get("SelfRegistrationCheckBoxes"),
			verificationCodeExpiryTime: values.get(VERIFICATION_CODE_EXPIRY_TIME),
			smsOTPExpiryTime: values.get(SMS_OTP_EXPIRY_TIME),
			callbackRegex: values.get(CALLBACK_REGEX)
		}
	};

	const showUserSelfRegistrationView = editingForm[USER_SELF_REGISTRATION_FORM_IDENTIFIER] ? (
		<EditSection>
			<Forms
				onSubmit={ (values) => {
					setSelfSignUpConfigs(getFormValues(values));
					handleSubmit();
				} }
				resetState={ reset }
			>
				<Field
					name="SelfRegistrationCheckBoxes"
					required={ false }
					requiredErrorMessage=""
					type="checkbox"
					children={ [
						{
							label: t("views:components.serverConfigs.selfRegistration.form.enable.label"),
							value: SELF_REGISTRATION_ENABLE
						},
						{
							label: t("views:components.serverConfigs.selfRegistration.form." +
								"enableAccountLockOnCreation.label"),
							value: ACCOUNT_LOCK_ON_CREATION
						},
						{
							label: t("views:components.serverConfigs.selfRegistration.form." +
								"internalNotificationManagement.label"),
							value: NOTIFICATION_INTERNALLY_MANAGED
						},
						{
							label: t("views:components.serverConfigs.selfRegistration.form.enableReCaptcha.label"),
							value: RE_CAPTCHA
						}
					] }
					value={ selfSignUpConfigs.checkboxValues }
				/>
				<Field
					label={ t(
						"views:components.serverConfigs.selfRegistration.form.verificationLinkExpiryTime.label"
					) }
					name={ VERIFICATION_CODE_EXPIRY_TIME }
					placeholder={ t(
						"views:components.serverConfigs.selfRegistration.form.verificationLinkExpiryTime.placeholder"
					) }
					required={ true }
					requiredErrorMessage={ t(
						"views:components.serverConfigs.selfRegistration.form.verificationLinkExpiryTime." +
						"validations.empty"
					) }
					type="number"
					value={ selfSignUpConfigs.verificationCodeExpiryTime }
					width={ 9 }
				/>
				<Hint>
					{ t("views:components.serverConfigs.selfRegistration.form.verificationLinkExpiryTime.placeholder") }
				</Hint>
				<Field
					label={ t(
						"views:components.serverConfigs.selfRegistration.form.smsOTPExpiryTime.label"
					) }
					name={ SMS_OTP_EXPIRY_TIME }
					placeholder={ t(
						"views:components.serverConfigs.selfRegistration.form.smsOTPExpiryTime.placeholder"
					) }
					required={ true }
					requiredErrorMessage={ t(
						"views:components.serverConfigs.selfRegistration.form.smsOTPExpiryTime.validations.empty"
					) }
					type="number"
					value={ selfSignUpConfigs.smsOTPExpiryTime }
					width={ 9 }
				/>
				<Hint>
					{ t("views:components.serverConfigs.selfRegistration.form.smsOTPExpiryTime.placeholder") }
				</Hint>
				<Field
					label={ t(
						"views:components.serverConfigs.selfRegistration.form.callbackURLRegex.label"
					) }
					name={ CALLBACK_REGEX }
					placeholder={ t(
						"views:components.serverConfigs.selfRegistration.form.callbackURLRegex.placeholder"
					) }
					required={ true }
					requiredErrorMessage={ t(
						"views:components.serverConfigs.selfRegistration.form.callbackURLRegex.validations.empty"
					) }
					type="text"
					value={ selfSignUpConfigs.callbackRegex }
					width={ 9 }
				/>
				<Field
					hidden={ true }
					type="divider"
				/>
				<Form.Group>
					<Field
						size="small"
						type="submit"
						value={ t("common:submit").toString() }
					/>
					<Field
						className="link-button"
						onClick={ () => {
							hideFormEditView(USER_SELF_REGISTRATION_FORM_IDENTIFIER);
						} }
						size="small"
						type="button"
						value={ t("common:cancel").toString() }
					/>
				</Form.Group>

			</Forms>
		</EditSection>
	) : null;

	return (
		<Section
			description={ t("views:components.serverConfigs.selfRegistration.description") }
			header={ t("views:components.serverConfigs.selfRegistration.heading") }
			icon={ SettingsSectionIcons.federatedAssociations }
			iconMini={ SettingsSectionIcons.federatedAssociationsMini }
			iconSize="auto"
			iconStyle="colored"
			iconFloated="right"
			onPrimaryActionClick={ () => showFormEditView(USER_SELF_REGISTRATION_FORM_IDENTIFIER) }
			primaryAction={ t("views:components.serverConfigs.selfRegistration.actionTitles.config") }
			primaryActionIcon="key"
		>
			{ showUserSelfRegistrationView }
			{ confirmationModal }
		</Section>
	);
};

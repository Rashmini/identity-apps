/**
 * Copyright (c) 2023, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
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

import { Chip, Typography } from "@oxygen-ui/react";
import { AutocompleteRenderGetTagProps } from "@oxygen-ui/react/Autocomplete";
import { AlertLevels, IdentifiableComponentInterface, RolesInterface } from "@wso2is/core/models";
import { addAlert } from "@wso2is/core/store";
import { AutocompleteFieldAdapter, FinalForm, FinalFormField, TextFieldAdapter } from "@wso2is/form";
import { Hint, Message } from "@wso2is/react-components";
import { AxiosError } from "axios";
import isEmpty from "lodash-es/isEmpty";
import React, { FunctionComponent, ReactElement, ReactNode, useMemo } from "react";
import { FormRenderProps } from "react-final-form";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Dispatch } from "redux";
import { UsersConstants } from "../../../../../extensions/components/users/constants";
import { useRolesList } from "../../../../roles/api";
import { UserManagementConstants } from "../../../constants";
import { sendParentOrgUserInvite } from "../api/invite";
import { UserInviteInterface } from "../models/invite";

interface RolesAutoCompleteOption {
    key: string;
    label: ReactNode;
    role: RolesInterface;
}

interface InviteParentOrgUserFormValuesInterface {
    username: string;
    roles: RolesAutoCompleteOption[];
}

interface InviteParentOrgUserFormErrorsInterface {
    username: string;
    roles: string;
}

/**
 * Props interface of {@link InviteParentOrgUser}
 */
interface InviteParentOrgUserPropsInterface extends IdentifiableComponentInterface {
    /**
     * Callback method for closing the wizard.
     */
    closeWizard: () => void;
    /**
     * Callback method for setting the isSubmitting state.
     */
    setIsSubmitting: (isSubmitting: boolean) => void;
    /**
     * The Callback method for when the user invite is successful.
     */
    onUserInviteSuccess: () => void;
}

/**
 * The invite parent organization user component.
 *
 * @returns Invite parent organization user component.
 */
export const InviteParentOrgUser: FunctionComponent<InviteParentOrgUserPropsInterface> = (
    props: InviteParentOrgUserPropsInterface
): ReactElement => {

    const {
        closeWizard,
        setIsSubmitting,
        onUserInviteSuccess,
        [ "data-componentid"]: componentId
    } = props;

    const { t } = useTranslation();
    const dispatch: Dispatch = useDispatch();
    const { data: allowedRoles } = useRolesList();

    const rolesAutocompleteOptions: RolesAutoCompleteOption[] = useMemo(() => {

        if (isEmpty(allowedRoles?.Resources)) {
            return [];
        }

        return allowedRoles?.Resources
            ?.filter((role: RolesInterface) => role.audience.display !== "Console")
            ?.map((role: RolesInterface) => {
                return {
                    key: role.id,
                    label: role.displayName,
                    role
                };
            });
    }, [ allowedRoles ]);

    /**
     * Handles the error scenario when sending an invitation to a user in a parent organization to join the current
     * organization.
     * @param error - Error response.
     */
    const handleParentOrgUserInviteError = (error: AxiosError) => {

        /**
         * Axios throws a generic `Network Error` for status code 401.
         * As a temporary solution, a check to see if a response
         * is available has been used.
         */
        if (!error.response || error.response.status === 401) {
            dispatch(addAlert({
                description: t("console:manage.features.invite.notifications.sendInvite.error.description"),
                level: AlertLevels.ERROR,
                message: t("console:manage.features.invite.notifications.sendInvite.error.message")
            }));
        } else if (error.response.status === 403 &&
            error?.response?.data?.code === UsersConstants.ERROR_COLLABORATOR_USER_LIMIT_REACHED) {
            dispatch(addAlert({
                description: t("extensions:manage.invite.notifications.sendInvite.limitReachError.description"),
                level: AlertLevels.ERROR,
                message: t("extensions:manage.invite.notifications.sendInvite.limitReachError.message")
            }));
        } else if (error?.response?.data?.description) {
            dispatch(addAlert({
                description: t(
                    "console:manage.features.invite.notifications.sendInvite.error.description",
                    { description: error.response.data.description }
                ),
                level: AlertLevels.ERROR,
                message: t("console:manage.features.invite.notifications.sendInvite.error.message")
            }));
        } else {
            // Generic error message
            dispatch(addAlert({
                description: t(
                    "console:manage.features.invite.notifications.sendInvite.genericError.description"
                ),
                level: AlertLevels.ERROR,
                message: t("console:manage.features.invite.notifications.sendInvite.genericError.message")
            }));
        }
    };

    /**
     * Sends an invitation to a user in a parent organization to join the current organization.
     * @param values - Form values.
     */
    const inviteParentOrgUser = (values: InviteParentOrgUserFormValuesInterface) => {

        const invite: UserInviteInterface = {
            roles: values?.roles?.map((role: RolesAutoCompleteOption) => role.role.id),
            username: values?.username
        };

        setIsSubmitting(true);

        sendParentOrgUserInvite(invite)
            .then(() => {
                dispatch(addAlert({
                    description: t(
                        "console:manage.features.invite.notifications.sendInvite.success.description"
                    ),
                    level: AlertLevels.SUCCESS,
                    message: t(
                        "console:manage.features.invite.notifications.sendInvite.success.message"
                    )
                }));
                onUserInviteSuccess && onUserInviteSuccess();
                closeWizard();
            })
            .catch((error: AxiosError) => {
                handleParentOrgUserInviteError(error);
            })
            .finally(() => {
                closeWizard();
                setIsSubmitting(false);
            });
    };

    /**
     * Validates the invite parent org user form values.
     * @param values - Form values.
     * @returns An error object containing validation error messages.
     */
    const validateInviteParentOrgUserForm = (
        values: InviteParentOrgUserFormValuesInterface
    ): InviteParentOrgUserFormErrorsInterface => {

        const errors: InviteParentOrgUserFormErrorsInterface = {
            roles: undefined,
            username: undefined
        };

        if (!values.username) {
            errors.username = t("console:manage.features.parentOrgInvitations.addUserWizard.username.validations" +
                ".required");
        }

        if (!values.roles || isEmpty(values.roles)) {
            errors.roles =  t("console:manage.features.parentOrgInvitations.addUserWizard.roles.validations.required");
        }

        return errors;
    };


    return (
        <FinalForm
            initialValues={ null }
            keepDirtyOnReinitialize={ true }
            data-componentid={ `${ componentId }-external-form` }
            onSubmit={ inviteParentOrgUser }
            validate={ validateInviteParentOrgUserForm }
            render={ ({ handleSubmit }: FormRenderProps) => {
                return (
                    <form
                        id={ UserManagementConstants.INVITE_PARENT_ORG_USER_FORM_ID }
                        onSubmit={ handleSubmit }
                        className="invite-parent-org-user-form">
                        <Message
                            type="info"
                            className="add-user-info"
                            content={ t("console:manage.features.parentOrgInvitations.addUserWizard.hint") }
                        />
                        <FinalFormField
                            fullWidth
                            ariaLabel="Username field"
                            data-componentid={ `${componentId}-external-form-username-input` }
                            label={ t("console:manage.features.parentOrgInvitations.addUserWizard.username.label") }
                            name="username"
                            placeholder={ t(
                                "console:manage.features.parentOrgInvitations.addUserWizard.username.placeholder"
                            ) }
                            required={ true }
                            type="text"
                            helperText={ (
                                <Hint>
                                    <Typography variant="inherit">
                                        { t("console:manage.features.parentOrgInvitations.addUserWizard.username" +
                                                ".hint") }
                                    </Typography>
                                </Hint>
                            ) }
                            component={ TextFieldAdapter }
                        />
                        <FinalFormField
                            fullWidth
                            required
                            freeSolo
                            multipleValues
                            ariaLabel="Roles field"
                            data-componentid={ `${componentId}-form-roles-field` }
                            name="roles"
                            label={ t("console:manage.features.parentOrgInvitations.addUserWizard.roles.label") }
                            helperText={
                                (<Hint>
                                    <Typography variant="inherit">
                                        { t("console:manage.features.parentOrgInvitations.addUserWizard.roles" +
                                                ".hint") }
                                    </Typography>
                                </Hint>)
                            }
                            placeholder={
                                t("console:manage.features.parentOrgInvitations.addUserWizard.roles.placeholder")
                            }
                            component={ AutocompleteFieldAdapter }
                            options={ rolesAutocompleteOptions }
                            renderTags={ (value: readonly any[], getTagProps: AutocompleteRenderGetTagProps) => {
                                return value.map((option: any, index: number) => (
                                    <Chip
                                        key={ index }
                                        size="medium"
                                        label={ option.label }
                                        { ...getTagProps({ index }) }
                                    />
                                ));
                            } }
                        />
                    </form>
                );
            } }
        />
    );
};

/**
 * Default props for the invite parent org user wizard component.
 */
InviteParentOrgUser.defaultProps = {
    "data-componentid": "invite-parent-org-user"
};

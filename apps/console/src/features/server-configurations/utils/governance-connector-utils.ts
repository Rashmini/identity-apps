/**
 * Copyright (c) 2022-2023, WSO2 LLC. (https://www.wso2.com).
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

import camelCase from "lodash-es/camelCase";
import { AlertLevels } from "@wso2is/core/models";
import { addAlert } from "@wso2is/core/store";
import { I18n } from "@wso2is/i18n";
import { AppConstants, store } from "../../core";
import { getConnectorCategories } from "../api";
import { ServerConfigurationsConstants } from "../constants";
import { 
    GovernanceCategoryForOrgsInterface, 
    GovernanceConnectorForOrgsInterface, 
    GovernanceConnectorInterface, 
    GovernanceConnectorsInterface 
} from "../models";
import { SetGovernanceConnectorCategory } from "../store/actions";

/**
 * Utility class for governance connectors.
 */
export class GovernanceConnectorUtils {

    /**
     * Private constructor to avoid object instantiation from outside
     * the class.
     *
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() { }

    /**
     * Clears the session related information and sign out from the session.
     */
    public static getGovernanceConnectors(): void {
        const connectorCategories: GovernanceConnectorsInterface = {
            categories: []
        };

        getConnectorCategories()
            .then((response) => {
                response.map(category => {
                    connectorCategories.categories.push({
                        id: category.id,
                        name: category.name
                    });
                });
                store.dispatch(SetGovernanceConnectorCategory(connectorCategories));
            })
            .catch((error) => {
                if (error.response && error.response.data && error.response.data.detail) {
                    store.dispatch(addAlert({
                        description: I18n.instance.t("console:manage.features.governanceConnectors.notifications." +
                            "getConnectorCategories.error.description", 
                        { description: error.response.data.description }),
                        level: AlertLevels.ERROR,
                        message: I18n.instance.t("console:manage.features.governanceConnectors.notifications." +
                            "getConfigurations.error.message")
                    }));
                } else {
                    // Generic error message
                    store.dispatch(addAlert({
                        description: I18n.instance.t("console:manage.features.governanceConnectors.notifications." +
                            "getConfigurations.genericError.description"),
                        level: AlertLevels.ERROR,
                        message: I18n.instance.t("console:manage.features.governanceConnectors.notifications." +
                            "getConfigurations.genericError.message")
                    }));
                }
            });
    }

    public static encodeConnectorPropertyName(name: string): string {
        return name.split(".").join("-");
    }

    public static decodeConnectorPropertyName(name: string): string {
        return name?.split("-").join(".");
    }

    /**
     * Governance connectors and their sub categories that will be visible in a sub organization
     */
    public static readonly SHOW_GOVERNANCE_CONNECTORS_FOR_SUBORGS: GovernanceCategoryForOrgsInterface[] = [
        {
            connectors: [
                {
                    friendlyName: "Account Recovery",
                    id: "YWNjb3VudC1yZWNvdmVyeQ",
                    name: "account-recovery",
                    properties: [
                        "Recovery.Notification.Password.Enable" // Notification based password recovery
                    ]
                }
            ],
            id: "QWNjb3VudCBNYW5hZ2VtZW50",
            name: "Account Management"
        },
        {
            connectors: [
                {
                    friendlyName: "Ask Password",
                    id: "dXNlci1lbWFpbC12ZXJpZmljYXRpb24",
                    name: "user-email-verification",
                    properties: [
                        "EmailVerification.Enable", // Enable user email verification
                        "EmailVerification.LockOnCreation", // Enable account lock on creation
                        "EmailVerification.Notification.InternallyManage", // Manage notifications sending internally
                        "EmailVerification.ExpiryTime", // Email verification code expiry time
                        "EmailVerification.AskPassword.ExpiryTime", // Username recoveryAsk password code expiry time
                        "EmailVerification.AskPassword.PasswordGenerator", 
                        // Temporary password generation extension class
                        "_url_listPurposeJITProvisioning" // Manage JIT provisioning purposes
                    ]
                }
            ],
            id: "VXNlciBPbmJvYXJkaW5n",
            name: "User Onboarding"
        } 
    ]

    /**
     * Filter governance categories of a connector for a sub organization.
     * @param governanceConnectors - List of categories to evaluate.
     * @param governanceCategoryId - Category id of the governance connector.
     * 
     * @returns Filtered categories as a list.
     */
    public static filterGovernanceConnectorCategories
    (governanceCategoryId: string, governanceConnectors: GovernanceConnectorInterface[])
    : GovernanceConnectorInterface[] {
        let showGovernanceConnectors = [];

        showGovernanceConnectors  = this.SHOW_GOVERNANCE_CONNECTORS_FOR_SUBORGS.filter(
            category => category.id === governanceCategoryId)[0].connectors;

        const showGovernanceConnectorsIdOfSuborgs = [];

        showGovernanceConnectors.forEach(connector => {
            showGovernanceConnectorsIdOfSuborgs.push(connector.id);
        });

        return governanceConnectors.filter(connector => {
            if (showGovernanceConnectorsIdOfSuborgs.includes(connector.id)) {
                const showProperties = this.getGovernanceConnectorsProperties(showGovernanceConnectors,
                    connector.id);
                
                connector.properties = connector.properties.filter(property => {
                    if (showProperties.includes(property.name)) {
                        return property;
                    }
                });

                return connector;
            }
        });
    }

    public static getPredefinedConnectorCategories() {
        return [
            {
                displayOrder: 1,
                id: "login-identifier",
                title: "Login Identifier",
                connectors: [ 
                    {
                        description: "Configure multiple attributes as the login identifier.",
                        id: ServerConfigurationsConstants.MULTI_ATTRIBUTE_LOGIN_CONNECTOR_ID,
                        header: "Multi Attribute Login",
                        route: AppConstants.getPaths()
                            .get("GOVERNANCE_CONNECTOR_EDIT")
                            .replace(":categoryId", 
                                ServerConfigurationsConstants.ACCOUNT_MANAGEMENT_CATEGORY_ID)
                            .replace(":connectorId", 
                                ServerConfigurationsConstants.MULTI_ATTRIBUTE_LOGIN_CONNECTOR_ID)
                    },
                    {
                        description: "Configure alternative login identifier settings.",
                        id: ServerConfigurationsConstants.ALTERNATIVE_LOGIN_IDENTIFIER,
                        header: "Alternative Login Identifier",
                        route: AppConstants.getPaths()
                            .get("ALTERNATIVE_LOGIN_IDENTIFIER_EDIT")
                    },
                    {
                        description: "Customize username validation rules for your users.",
                        id: ServerConfigurationsConstants.USERNAME_VALIDATION,
                        header: "Username Validation",
                        route: AppConstants.getPaths().get("USERNAME_VALIDATION_EDIT")
                    }
                ]
            },
            {
                displayOrder: 1,
                id: "login-security",
                title: "Login Security",
                connectors: [ 
                    {
                        description: "Customize password validation rules for your users.",
                        id: ServerConfigurationsConstants.IDENTITY_GOVERNANCE_PASSWORD_POLICIES_ID,
                        header: "Password Validation",
                        route: AppConstants.getPaths().get("VALIDATION_CONFIG_EDIT")
                    },
                    {
                        description: "Configure account lock on consecutive failed " + 
                            "login attempts.",
                        id: ServerConfigurationsConstants.LOGIN_ATTEMPT_SECURITY,
                        header: "Login Attempts",
                        route: AppConstants.getPaths()
                            .get("GOVERNANCE_CONNECTOR_EDIT")
                            .replace(
                                ":categoryId",
                                ServerConfigurationsConstants.LOGIN_ATTEMPT_SECURITY_CONNECTOR_CATEGORY_ID
                            )
                            .replace(
                                ":connectorId",
                                ServerConfigurationsConstants.ACCOUNT_LOCKING_CONNECTOR_ID
                            )
                    },
                    {
                        description: "Enable reCAPTCHA for the organization.",
                        id: ServerConfigurationsConstants.CAPTCHA_FOR_SSO_LOGIN_CONNECTOR_ID,
                        header: "Bot Detection",
                        route: AppConstants.getPaths().get("GOVERNANCE_CONNECTOR_EDIT")
                            .replace(
                                ":categoryId",
                                ServerConfigurationsConstants.LOGIN_ATTEMPT_SECURITY_CONNECTOR_CATEGORY_ID
                            )
                            .replace(
                                ":connectorId",
                                ServerConfigurationsConstants.CAPTCHA_FOR_SSO_LOGIN_CONNECTOR_ID
                            )
                    },
                    {
                        description: "Manage and configure user session settings and preferences.",
                        id: ServerConfigurationsConstants.SESSION_MANAGEMENT_CONNECTOR_ID,
                        header: I18n.instance.t("console:sessionManagement.title"),
                        route: AppConstants.getPaths().get("SESSION_MANAGEMENT")
                    },
                    {
                        description: "Authenticate confidential clients to the authorization" 
                            + " server when using the token endpoint.",
                        id: ServerConfigurationsConstants.PRIVATE_KEY_JWT_CLIENT_AUTH,
                        header: "Private Key JWT Client Authentication for OIDC",
                        route: AppConstants.getPaths().get("PRIVATE_KEY_JWT_CONFIG_EDIT")
                    }
                ]
            },
            {
                displayOrder: 1,
                id: "user-onboarding",
                title: "User Onboarding",
                connectors: [ 
                    {
                        description: "Enable self registration for users of the organization.",
                        id: ServerConfigurationsConstants.SELF_SIGN_UP_CONNECTOR_ID,
                        header: "Self Registration",
                        route: AppConstants.getPaths()
                            .get("GOVERNANCE_CONNECTOR_EDIT")
                            .replace(":categoryId", ServerConfigurationsConstants.USER_ONBOARDING_CONNECTOR_ID)
                            .replace(":connectorId", ServerConfigurationsConstants.SELF_SIGN_UP_CONNECTOR_ID)
                    },
                    {
                        description: "Allow users choose passwords in admin-initiated onboarding.",
                        id: ServerConfigurationsConstants.ASK_PASSWORD_CONNECTOR_ID,
                        header: "Invite User to Set Password",
                        route: AppConstants.getPaths().get("GOVERNANCE_CONNECTOR_EDIT")
                            .replace(":categoryId", ServerConfigurationsConstants.USER_ONBOARDING_CONNECTOR_ID)
                            .replace(
                                ":connectorId",
                                ServerConfigurationsConstants.ASK_PASSWORD_CONNECTOR_ID)
                    } 
                ]
            },
            {
                displayOrder: 1,
                id: "account-recovery",
                title: "Account Recovery",
                connectors: [ 
                    {
                        description: "Enable self-service password recovery for users on the login page.",
                        id: ServerConfigurationsConstants.PASSWORD_RECOVERY,
                        header: "Password Recovery",
                        route: AppConstants.getPaths()
                            .get("GOVERNANCE_CONNECTOR_EDIT")
                            .replace(":categoryId",
                                ServerConfigurationsConstants.ACCOUNT_MANAGEMENT_CONNECTOR_CATEGORY_ID)
                            .replace(":connectorId",
                                ServerConfigurationsConstants.ACCOUNT_RECOVERY_CONNECTOR_ID)
                    },
                    {
                        description: "Enable self-service username recovery for users on the login page.",
                        id: ServerConfigurationsConstants.USERNAME_RECOVERY,
                        header: "Username Recovery",
                        route: AppConstants.getPaths()
                            .get("USERNAME_RECOVERY_CONNECTOR_EDIT")
                            .replace(
                                ":type",
                                "username"
                            )
                            .replace(":categoryId",
                                ServerConfigurationsConstants.ACCOUNT_MANAGEMENT_CONNECTOR_CATEGORY_ID)
                            .replace(":connectorId",
                                ServerConfigurationsConstants.ACCOUNT_RECOVERY_CONNECTOR_ID)
                    },
                    {
                        description: "Enable administrators to initiate password reset process for users.",
                        id: ServerConfigurationsConstants.ORGANIZATION_SELF_SERVICE_CONNECTOR_ID,
                        header: "Admin Initiated Password Reset",
                        route: AppConstants.getPaths()
                            .get("GOVERNANCE_CONNECTOR_EDIT")
                            .replace(":categoryId", 
                                ServerConfigurationsConstants.ACCOUNT_MANAGEMENT_CATEGORY_ID)
                            .replace(":connectorId", 
                                ServerConfigurationsConstants.ADMIN_FORCED_PASSWORD_RESET)
                    }
                ]
            },
            {
                displayOrder: 0,
                id: "sso-settings",
                title: "Single Sign-On (SSO) Settings",
                connectors: [ 
                    {
                        description: "Configure settings for SAML2 Web Single Sign-On functionality.",
                        id: ServerConfigurationsConstants.SAML2_SSO_CONNECTOR_ID,
                        header: I18n.instance.t("console:saml2Config.title"),
                        route: AppConstants.getPaths().get("SAML2_CONFIGURATION")
                    },
                    {
                        description: "Manage settings for WS-Federation based single sign-on.",
                        id: ServerConfigurationsConstants.WS_FEDERATION_CONNECTOR_ID,
                        header: I18n.instance.t("console:wsFederationConfig.title"),
                        route: AppConstants.getPaths().get("WSFED_CONFIGURATION")
                    } 
                ]
            }
        ];
    }

    public static resolveFieldLabel(category: string, name: string, displayName: string): string {
        const fieldLabelKey: string = "console:manage.features.governanceConnectors.connectorCategories." +
                camelCase(category) + ".connectors." + camelCase(name) +
                ".properties." + camelCase(name) + ".label";

        let fieldLabel: string = displayName;

        if (I18n.instance.exists(fieldLabelKey)) {
            fieldLabel = I18n.instance.t(fieldLabelKey);
        }

        return fieldLabel;
    }

    public static resolveFieldHint(category: string, name: string, description: string): string {
        const fieldHintKey: string = "console:manage.features.governanceConnectors.connectorCategories." +
                camelCase(category) + ".connectors." + camelCase(name) +
                ".properties." + camelCase(name) + ".hint";
            
        let fieldHint: string = description;

        if (I18n.instance.exists(fieldHintKey)) {
            fieldHint = I18n.instance.t(fieldHintKey);
        }
        
        return fieldHint;
    }

    /**
     * Get governance connector properties for a given connector.
     * @param showGovernanceConnectors - Category id of the governance connector.
     * @param governanceConnectorId - Connector id.
     * 
     * @returns governance connector properties as a list.
     */
    private static getGovernanceConnectorsProperties
    (showGovernanceConnectors: GovernanceConnectorForOrgsInterface[], governanceConnectorId: string) {

        return showGovernanceConnectors.filter(connector=>connector.id===governanceConnectorId)[0].properties;

    }
}

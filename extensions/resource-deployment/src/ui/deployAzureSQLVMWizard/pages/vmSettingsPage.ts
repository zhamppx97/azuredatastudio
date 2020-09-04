/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as azdata from 'azdata';
import * as constants from '../constants';
import { WizardPageBase } from '../../wizardPageBase';
import { DeployAzureSQLVMWizard } from '../deployAzureSQLVMWizard';

export class VmSettingsPage extends WizardPageBase<DeployAzureSQLVMWizard> {

	private _vmSize: string[] = [];

	// textbox for vm name
	private _vmNameTextBox!: azdata.InputBoxComponent;

	// textbox for vm admin username
	private _adminUsernameTextBox!: azdata.InputBoxComponent;

	// textbox for vm admin password
	private _adminPasswordTextBox!: azdata.InputBoxComponent;

	// textbox for vm admin confirm password
	private _adminComfirmPasswordTextBox!: azdata.InputBoxComponent;

	// dropdown for sql vm image
	private _vmImageDropdown!: azdata.DropDownComponent;
	private _vmImageDropdownLoader!: azdata.LoadingComponent;

	// dropdown for sql vm image sku <- sql vm image
	private _vmImageSkuDropdown!: azdata.DropDownComponent;
	private _vmImageSkuDropdownLoader!: azdata.LoadingComponent;

	// dropdown for sql vm image version <- sql vm image sku
	private _vmImageVersionDropdown!: azdata.DropDownComponent;
	private _vmImageVersionDropdownLoader!: azdata.LoadingComponent;

	// dropdown for sql vm size
	private _vmSizeDropdown!: azdata.DropDownComponent;
	private _vmSizeDropdownLoader!: azdata.LoadingComponent;

	private _form!: azdata.FormContainer;

	constructor(wizard: DeployAzureSQLVMWizard) {
		super(
			constants.VmSettingsPageTitle,
			constants.VmSettingsPageDescription,
			wizard
		);
	}

	public async initialize() {
		this.pageObject.registerContent(async (view: azdata.ModelView) => {

			await this.createVmNameTextBox(view);
			await this.createAdminUsernameTextBox(view);
			await this.createAdminPasswordTextBox(view);
			await this.createAdminPasswordConfirmTextBox(view);
			await this.createVmImageDropdown(view);
			await this.createVMImageSkuDropdown(view);
			await this.createVMImageVersionDropdown(view);
			await this.createVmSizeDropdown(view);

			this._form = view.modelBuilder.formContainer()
				.withFormItems(
					[
						{
							component: this.wizard.createFormRowComponent(view, constants.VmNameTextBoxLabel, '', this._vmNameTextBox, true)
						},
						{
							component: this.wizard.createFormRowComponent(view, constants.VmAdminUsernameTextBoxLabel, '', this._adminUsernameTextBox, true)
						},
						{
							component: this.wizard.createFormRowComponent(view, constants.VmAdminPasswordTextBoxLabel, '', this._adminPasswordTextBox, true)
						},
						{
							component: this.wizard.createFormRowComponent(view, constants.VmAdminConfirmPasswordTextBoxLabel, '', this._adminComfirmPasswordTextBox, true)
						},
						{
							component: this.wizard.createFormRowComponent(view, constants.VmImageDropdownLabel, '', this._vmImageDropdownLoader, true)
						},
						{
							component: this.wizard.createFormRowComponent(view, constants.VmSkuDropdownLabel, '', this._vmImageSkuDropdownLoader, true)
						},
						{
							component: this.wizard.createFormRowComponent(view, constants.VmVersionDropdownLabel, '', this._vmImageVersionDropdownLoader, true)
						},
						{
							component: this.wizard.createFormRowComponent(view, constants.VmSizeDropdownLabel, '', this._vmSizeDropdownLoader, true)
						}
					],
					{
						horizontal: false,
						componentWidth: '100%'
					})
				.withLayout({ width: '100%' })
				.component();


			return view.initializeModel(this._form);
		});
	}

	public async onEnter(): Promise<void> {
		this.populateVmImageDropdown();
		this.populateVmSizeDropdown();
		this.wizard.wizardObject.registerNavigationValidator((pcInfo) => {

			if (pcInfo.newPage < pcInfo.lastPage) {
				return true;
			}

			let showErrorMessage = '';
			/**
			 * VM name rules:
			 * 	1. 1-15 characters
			 *  2. Cannot contain only numbers
			 *  3. Cannot start with underscore and end with period or hyphen
			 *  4. Virtual machine name cannot contain special characters \/""[]:|<>+=;,?*
			 */
			let vmname = this.wizard.model.vmName;
			if (vmname.length < 1 && vmname.length > 15) {
				showErrorMessage += 'Virtual machine name must be between 1 and 15 characters long.\n';
			}
			if (/^\d+$/.test(vmname)) {
				showErrorMessage += 'Virtual machine name cannot contain only numbers.\n';
			}
			if (vmname.charAt(0) === '_' || vmname.slice(-1) === '.' || vmname.slice(-1) === '-') {
				showErrorMessage += 'Virtual machine name Can\'t start with underscore. Can\'t end with period or hyphen\n';
			}
			if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(vmname)) {
				showErrorMessage += 'Virtual machine name cannot contain special characters \/""[]:|<>+=;,?* .\n';
			}


			/**
			 * VM admin/root username rules:
			 *  1. 1-20 characters long
			 *  2. cannot contain special characters \/""[]:|<>+=;,?*
			 */
			let username = this.wizard.model.vmUsername;
			if (username.length < 1 || username.length > 20) {
				showErrorMessage += 'Username must be between 1 and 20 characters long.\n';
			}
			if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(username)) {
				showErrorMessage += 'Username cannot contain special characters \/""[]:|<>+=;,?* .\n';
			}

			showErrorMessage += this.wizard.validatePassword(this.wizard.model.vmPassword);

			if (this.wizard.model.vmPassword !== this._adminComfirmPasswordTextBox.value) {
				showErrorMessage += 'Password and confirm password must match.\n';
			}

			if (this._vmSize.includes((this._vmSizeDropdown.value as azdata.CategoryValue).name)) {
				showErrorMessage += 'Select a virtual machine size.\n';
			}

			this.wizard.showErrorMessage(showErrorMessage);

			if (showErrorMessage !== '') {
				return false;
			}
			return true;
		});
	}

	public onLeave(): void {
		this.wizard.wizardObject.registerNavigationValidator((pcInfo) => {
			return false;
		});
	}


	private async createVmNameTextBox(view: azdata.ModelView) {
		this._vmNameTextBox = view.modelBuilder.inputBox().withProperties({
		}).component();

		this._vmNameTextBox.onTextChanged((value) => {
			this.wizard.model.vmName = value;
		});
	}

	private async createAdminUsernameTextBox(view: azdata.ModelView) {
		this._adminUsernameTextBox = view.modelBuilder.inputBox().withProperties({
		}).component();

		this._adminUsernameTextBox.onTextChanged((value) => {
			this.wizard.model.vmUsername = value;
		});
	}

	private async createAdminPasswordTextBox(view: azdata.ModelView) {
		this._adminPasswordTextBox = view.modelBuilder.inputBox().withProperties({
			inputType: 'password',
		}).component();

		this._adminPasswordTextBox.onTextChanged((value) => {
			this.wizard.model.vmPassword = value;
		});
	}

	private async createAdminPasswordConfirmTextBox(view: azdata.ModelView) {
		this._adminComfirmPasswordTextBox = view.modelBuilder.inputBox().withProperties({
			inputType: 'password',
		}).component();

		this._adminComfirmPasswordTextBox.onTextChanged((value) => {
		});
	}

	private async createVmImageDropdown(view: azdata.ModelView) {
		this._vmImageDropdown = view.modelBuilder.dropDown().withProperties({
		}).component();

		this._vmImageDropdown.onValueChanged((value) => {
			this.wizard.model.vmImage = (this._vmImageDropdown.value as azdata.CategoryValue).name;
			this._vmImageSkuDropdownLoader.loading = true;
			this._vmImageVersionDropdownLoader.loading = true;
			this._vmImageVersionDropdownLoader.loading = true;
			this.populateVmImageSkuDropdown();
		});

		this._vmImageDropdownLoader = view.modelBuilder.loadingComponent().withItem(this._vmImageDropdown).component();
	}

	private async populateVmImageDropdown() {
		this._vmImageDropdownLoader.loading = true;
		this._vmImageSkuDropdownLoader.loading = true;
		this._vmImageVersionDropdownLoader.loading = true;
		this._vmImageVersionDropdownLoader.loading = true;

		let url = `https://management.azure.com` +
			`/subscriptions/${this.wizard.model.azureSubscription}` +
			`/providers/Microsoft.Compute` +
			`/locations/${this.wizard.model.azureRegion}` +
			`/publishers/MicrosoftSQLServer` +
			`/artifacttypes/vmimage/offers` +
			`?api-version=2019-12-01`;

		let response = await this.wizard.getRequest(url);
		response.data = response.data.reverse();
		this.wizard.addDropdownValues(
			this._vmImageDropdown,
			response.data.filter((value: any) => {
				return !new RegExp('-byol').test(value.name);
			})
				.map((value: any) => {
					let sqlServerVersion = value.name.toLowerCase().match(new RegExp('sql(.*?)-'))[1];
					let osVersion = value.name.toLowerCase().replace(new RegExp('sql(.*?)-'), '');
					osVersion = osVersion.replace(new RegExp('ws'), 'Windows Server ');
					osVersion = osVersion.replace(new RegExp('ubuntu'), 'Ubuntu Server ');
					osVersion = osVersion.replace(new RegExp('sles'), 'SUSE Linux Enterprise Server (SLES) ');
					osVersion = osVersion.replace(new RegExp('rhel'), 'Red Hat Enterprise Linux ');
					return {
						displayName: `SQL Server ${sqlServerVersion.toUpperCase()} on ${osVersion}`,
						name: value.name
					};
				})
		);

		this.wizard.model.vmImage = (this._vmImageDropdown.value as azdata.CategoryValue).name;
		this._vmImageDropdownLoader.loading = false;
		this.populateVmImageSkuDropdown();
	}

	private async createVMImageSkuDropdown(view: azdata.ModelView) {
		this._vmImageSkuDropdown = view.modelBuilder.dropDown().withProperties({
		}).component();

		this._vmImageSkuDropdown.onValueChanged((value) => {
			this.wizard.model.vmImageSKU = (this._vmImageSkuDropdown.value as azdata.CategoryValue).name;
			this.populateVmImageVersionDropdown();
		});

		this._vmImageSkuDropdownLoader = view.modelBuilder.loadingComponent().withItem(this._vmImageSkuDropdown).component();
	}

	private async populateVmImageSkuDropdown() {
		this._vmImageSkuDropdownLoader.loading = true;
		let url = `https://management.azure.com` +
			`/subscriptions/${this.wizard.model.azureSubscription}` +
			`/providers/Microsoft.Compute` +
			`/locations/${this.wizard.model.azureRegion}` +
			`/publishers/MicrosoftSQLServer` +
			`/artifacttypes/vmimage/offers/${this.wizard.model.vmImage}` +
			`/skus?api-version=2019-12-01`;

		let response = await this.wizard.getRequest(url);

		this.wizard.addDropdownValues(
			this._vmImageSkuDropdown,
			response.data.map((value: any) => {
				return {
					name: value.name,
					displayName: value.name
				};
			})
		);

		this.wizard.model.vmImageSKU = (this._vmImageSkuDropdown.value as azdata.CategoryValue).name;
		this._vmImageSkuDropdownLoader.loading = false;
		this.populateVmImageVersionDropdown();
	}

	private async createVMImageVersionDropdown(view: azdata.ModelView) {
		this._vmImageVersionDropdown = view.modelBuilder.dropDown().withProperties({
		}).component();

		this._vmImageVersionDropdown.onValueChanged((value) => {
			this.wizard.model.vmImageVersion = (this._vmImageVersionDropdown.value as azdata.CategoryValue).name;
		});

		this._vmImageVersionDropdownLoader = view.modelBuilder.loadingComponent().withItem(this._vmImageVersionDropdown).component();
	}

	private async populateVmImageVersionDropdown() {
		this._vmImageVersionDropdownLoader.loading = true;
		let url = `https://management.azure.com` +
			`/subscriptions/${this.wizard.model.azureSubscription}` +
			`/providers/Microsoft.Compute` +
			`/locations/${this.wizard.model.azureRegion}` +
			`/publishers/MicrosoftSQLServer` +
			`/artifacttypes/vmimage/offers/${this.wizard.model.vmImage}` +
			`/skus/${this.wizard.model.vmImageSKU}` +
			`/versions?api-version=2019-12-01`;

		let response = await this.wizard.getRequest(url);

		this.wizard.addDropdownValues(
			this._vmImageVersionDropdown,
			response.data.map((value: any) => {
				return {
					name: value.name,
					displayName: value.name
				};
			})
		);

		this.wizard.model.vmImageVersion = (this._vmImageVersionDropdown.value as azdata.CategoryValue).name;
		this._vmImageVersionDropdownLoader.loading = false;
	}


	private async createVmSizeDropdown(view: azdata.ModelView) {
		this._vmSizeDropdown = view.modelBuilder.dropDown().withProperties({
			editable: true
		}).component();

		this._vmSizeDropdown.onValueChanged((value) => {
			this.wizard.model.vmSize = (this._vmSizeDropdown.value as azdata.CategoryValue).name;
		});

		this._vmSizeDropdownLoader = view.modelBuilder.loadingComponent().withItem(this._vmSizeDropdown).component();
	}

	private async populateVmSizeDropdown() {
		this._vmSizeDropdownLoader.loading = true;
		let url = `https://management.azure.com` +
			`/subscriptions/${this.wizard.model.azureSubscription}` +
			`/providers/Microsoft.Compute` +
			`/skus?api-version=2019-04-01` +
			`&$filter=location eq '${this.wizard.model.azureRegion}'`;

		let response = await this.wizard.getRequest(url);

		let vmResouces: any[] = [];
		response.data.value.map((res: any) => {
			if (res.resourceType === 'virtualMachines') {
				vmResouces.push(res);
			}
		});

		let dropDownValues = vmResouces.map((value: any) => {
			if (value.capabilities) {
				let cores;
				if (value.capabilities.filter((c: any) => { return c.name === 'vCPUsAvailable'; }).length !== 0) {
					cores = value.capabilities.filter((c: any) => { return c.name === 'vCPUsAvailable'; })[0].value;
				} else {
					cores = value.capabilities.filter((c: any) => { return c.name === 'vCPUs'; })[0].value;
				}
				const memory = value.capabilities.filter((c: any) => { return c.name === 'MemoryGB'; })[0].value;
				const discSize = Number(value.capabilities.filter((c: any) => { return c.name === 'MaxResourceVolumeMB'; })[0].value) / 1024;
				const discCount = value.capabilities.filter((c: any) => { return c.name === 'MaxDataDiskCount'; })[0].value;
				const displayText = `${value.name}	Cores: ${cores}	Memory: ${memory}GB	discCount: ${discCount}	discSize: ${discSize}GB`;
				this._vmSize.push(displayText);
				return {
					name: value.name,
					displayName: displayText
				};
			}
			return;
		});

		dropDownValues.sort((a, b) => (a!.displayName > b!.displayName) ? 1 : -1);

		this._vmSize = [];

		this._vmSizeDropdown.updateProperties({
			values: dropDownValues,
			value: dropDownValues[0],
			width: '480px'
		});
		this.wizard.model.vmSize = (this._vmSizeDropdown.value as azdata.CategoryValue).name;
		this._vmSizeDropdownLoader.loading = false;
	}


}

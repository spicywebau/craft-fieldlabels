<?php
namespace Craft;

/**
 * Class RelabelPlugin
 *
 * Thank you for using Craft Relabel!
 * @see https://github.com/benjamminf/craft-relabel
 * @package Craft
 */
class RelabelPlugin extends BasePlugin
{
	function getName()
	{
		return Craft::t('Relabel');
	}

	public function getDescription()
	{
		return 'Override field labels and instructions in the field layout designer';
	}

	function getVersion()
	{
		return '0.1.3';
	}

	public function getSchemaVersion()
	{
		return '1.0.0';
	}

	function getDeveloper()
	{
		return 'Benjamin Fleming';
	}

	function getDeveloperUrl()
	{
		return 'http://benjamminf.github.io';
	}

	public function getDocumentationUrl()
	{
		return 'https://github.com/benjamminf/craft-relabel/blob/master/README.md';
	}

	public function getReleaseFeedUrl()
	{
		return 'https://raw.githubusercontent.com/benjamminf/craft-relabel/master/releases.json';
	}

	public function init()
	{
		parent::init();

		if($this->isCraftRequiredVersion())
		{
			$this->includeResources();
			$this->bindEvent();
		}
	}

	public function isCraftRequiredVersion()
	{
		return version_compare(craft()->getVersion(), '2.5', '>=');
	}

	protected function includeResources()
	{
		if(craft()->request->isCpRequest() && !craft()->request->isAjaxRequest())
		{
			craft()->templates->includeCssResource('relabel/css/main.css');
			craft()->templates->includeJsResource('relabel/js/Relabel.js');

			if(craft()->userSession->isAdmin())
			{
				craft()->templates->includeJsResource('relabel/js/Editor.js');
				craft()->templates->includeJsResource('relabel/js/EditorModal.js');
			}

			craft()->templates->includeJs('Relabel.fields=' . json_encode($this->_getFields()));
			craft()->templates->includeJs('Relabel.labels=' . json_encode($this->_getLabels()));
			craft()->templates->includeJs('Relabel.layouts=' . json_encode($this->_getLayouts()));
			craft()->templates->includeJs('Relabel.setup()');
		}
	}

	protected function bindEvent()
	{
		craft()->on('fields.saveFieldLayout', function(Event $e)
		{
			$layout = $e->params['layout'];
			$relabel = craft()->request->getPost('relabel');

			if($relabel)
			{
				$transaction = craft()->db->getCurrentTransaction() ? false : craft()->db->beginTransaction();
				try
				{
					foreach($relabel as $fieldId => $labelInfo)
					{
						$label = new RelabelModel();
						$label->fieldId = $fieldId;
						$label->fieldLayoutId = $layout->id;

						if(array_key_exists('name', $labelInfo))
						{
							$label->name = $labelInfo['name'];
						}

						if(array_key_exists('instructions', $labelInfo))
						{
							$label->instructions = $labelInfo['instructions'];
						}

						craft()->relabel->saveLabel($label);
					}

					if($transaction)
					{
						$transaction->commit();
					}
				}
				catch(\Exception $e)
				{
					if($transaction)
					{
						$transaction->rollback();
					}

					throw $e;
				}

				// Make sure these labels don't get saved more than once
				unset($_POST['relabel']);
			}
		});
	}

	private function _getFields()
	{
		$fields = craft()->fields->getAllFields();
		$output = array();

		foreach($fields as $field)
		{
			$output[(int) $field->id] = array(
				'id' => (int) $field->id,
				'handle' => $field->handle,
				'name' => $field->name,
				'instructions' => $field->instructions
			);
		}

		return $output;
	}

	private function _getLabels()
	{
		$labels = craft()->relabel->getAllLabels();
		$output = array();

		foreach($labels as $label)
		{
			$output[$label->id] = array(
				'id' => (int) $label->id,
				'fieldId' => (int) $label->fieldId,
				'fieldLayoutId' => (int) $label->fieldLayoutId,
				'name' => Craft::t($label->name),
				'instructions' => Craft::t($label->instructions),
			);
		}

		return $output;
	}

	private function _getLayouts()
	{
		$assetSources = craft()->assetSources->getAllSources();
		$categoryGroups = craft()->categories->getAllGroups();
		$globalSets = craft()->globals->getAllSets();
		$entryTypes = EntryTypeModel::populateModels(EntryTypeRecord::model()->ordered()->findAll());
		$tagGroups = craft()->tags->getAllTagGroups();
		//$userFields = FieldLayoutModel::populateModel(FieldLayoutRecord::model()->findByAttributes('type', ElementType::User));

		$sections = craft()->sections->getAllSections();
		$singleSections = array();

		foreach($sections as $section)
		{
			$entryType = $section->getEntryTypes()[0];
			$singleSections[$section->id] = (int) $entryType->fieldLayoutId;
		}

		return array(
			'assetSource' => $this->_mapLayouts($assetSources),
			'categoryGroup' => $this->_mapLayouts($categoryGroups),
			'globalSet' => $this->_mapLayouts($globalSets),
			'entryType' => $this->_mapLayouts($entryTypes),
			'tagGroup' => $this->_mapLayouts($tagGroups),
			//'userFields' => $userFields->id,
			'singleSection' => $singleSections,
		);
	}

	private function _mapLayouts($list)
	{
		$output = array();

		foreach($list as $item)
		{
			$output[(int) $item->id] = (int) $item->fieldLayoutId;
		}

		return $output;
	}
}

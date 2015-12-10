<?php
namespace Craft;

/**
 * Class RelabelService
 */
class RelabelService extends BaseApplicationComponent
{
	public function getAllLabels()
	{
		$labelRecords = RelabelRecord::model()->findAll();
		$labels = RelabelModel::populateModels($labelRecords);

		return $labels;
	}

	public function getLabels($fieldLayoutId)
	{

	}

	public function saveLabel(RelabelModel $label)
	{
		$isExisting = is_int($label->id);
		$record = new RelabelRecord();

		if($isExisting)
		{
			$record = RelabelRecord::model()->findById($label->id);

			if(!$record)
			{
				throw new Exception(Craft::t('No label exists with the ID “{id}”.', array('id' => $label->id)));
			}
		}

		$field = craft()->fields->getFieldById($label->fieldId);
		$layout = craft()->fields->getLayoutById($label->fieldLayoutId);

		if(!$field)
		{
			throw new Exception(Craft::t('No field exists with the ID “{id}”.', array('id' => $label->fieldId)));
		}

		if(!$layout)
		{
			throw new Exception(Craft::t('No field layout exists with the ID “{id}”.', array('id' => $label->fieldLayoutId)));
		}

		$record->fieldId = $label->fieldId;
		$record->fieldLayoutId = $label->fieldLayoutId;
		$record->name = $label->name;
		$record->instructions = $label->instructions;

		$record->validate();
		$label->addErrors($record->getErrors());

		$success = !$label->hasErrors();

		if($success)
		{
			$event = new Event($this, array(
				'label'        => $label,
				'isNewRelabel' => !$isExisting,
			));

			$this->onBeforeSaveLabel($event);

			if($event->performAction)
			{
				// Create transaction only if this isn't apart of an already occurring transaction
				$transaction = craft()->db->getCurrentTransaction() ? false : craft()->db->beginTransaction();

				try
				{
					$record->save(false);

					if(!$isExisting)
					{
						$label->id = $record->id;
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

				$this->onSaveLabel(new Event($this, array(
					'label'        => $label,
					'isNewRelabel' => !$isExisting,
				)));
			}
		}

		return $success;
	}

	/**
	 * An event dispatcher for the moment before saving a label.
	 *
	 * @param Event $event
	 * @throws \CException
	 */
	public function onBeforeSaveLabel(Event $event)
	{
		$this->raiseEvent('onBeforeSaveLabel', $event);
	}

	/**
	 * An event dispatcher for the moment after saving a label.
	 *
	 * @param Event $event
	 * @throws \CException
	 */
	public function onSaveLabel(Event $event)
	{
		$this->raiseEvent('onSaveLabel', $event);
	}
}

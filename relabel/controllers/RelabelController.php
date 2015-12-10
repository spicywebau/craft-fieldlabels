<?php
namespace Craft;

/**
 * Class RelabelController
 */
class RelabelController extends BaseController
{
	public function actionSaveLabel()
	{
		$this->requireAdmin();
		$this->requirePostRequest();
		$this->requireAjaxRequest();

		$label = new RelabelModel();

		$label->id            = craft()->request->getPost('id');
		$label->fieldId       = craft()->request->getRequiredPost('fieldId');
		$label->fieldLayoutId = craft()->request->getRequiredPost('fieldLayoutId');
		$label->name          = craft()->request->getPost('name');
		$label->instructions  = craft()->request->getPost('instructions');

		$success = craft()->relabel->saveLabel($label);

		$this->returnJson(array(
			'success' => $success,
			'errors'  => $label->getAllErrors(),
			'label'   => array(
				'field'        => $label->field,
				'fieldLayout'  => $label->fieldLayout,
				'name'         => $label->name,
				'instructions' => $label->instructions,
			),
		));
	}
}

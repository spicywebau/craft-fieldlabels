<?php
namespace Craft;

class RelabelController extends BaseController
{
	public function actionGetEditorHtml()
	{
		register_shutdown_function(function()
		{
			$element = false;

			$elementId = craft()->request->getPost('elementId');
			$elementType = craft()->request->getPost('elementType');

			if($elementId !== null)
			{
				if($elementType === null)
				{
					$elementType = craft()->elements->getElementTypeById($elementId);
				}

				$element = craft()->elements->getElementById($elementId, $elementType);
			}

			if($element)
			{
				$json = JsonHelper::decode(ob_get_clean());

				switch($elementType)
				{
					case ElementType::Entry:
					{
						$json['elementType'] = 'entry';
						$json['sectionId'] = $element->sectionId;
						$json['entryTypeId'] = $element->typeId;
						break;
					}
				}

				echo JsonHelper::encode($json);
			}
		});

		craft()->runController('elements/getEditorHtml');
	}
}

<?php
namespace Craft;

class RelabelController extends BaseController
{
	public function actionGetEditorHtml()
	{
		/*
		 * Now *this* is what you call a hack!
		 *
		 * Okay, so what's going on here is the controller action that returns editor HTML for elements is being
		 * intercepted so extra data can be passed. The `getEditorHtml` action expects an AJAX request, and it returns
		 * JSON data. This means this action calls the `returnJson` helper function which actually echo's JSON and then
		 * immediately kills any more processing by calling `exit`.
		 *
		 * In the Javascript, the ElementEditor class is modified to request this controller action instead of the
		 * elements one. However best practice would not allow copying and pasting the entire elements controller, which
		 * is what would've needed to be done. You generally want to reuse as much code as possible, *especially* if
		 * that code is third-party and subject to change.
		 *
		 * So that leaves finding a way to call the controller action manually, as well as intercepting the data before
		 * the application is exited.
		 *
		 * Fortunately Brad Bell posted a way to manually call an action on the exchange, which you can see here:
		 * http://craftcms.stackexchange.com/a/8814/3811
		 *
		 * Intercepting the outputted JSON was a little more tricky. Thankfully PHP supplies a way of registering a
		 * callback when the application exits, seen here:
		 * http://php.net/manual/en/function.register-shutdown-function.php
		 * At the point this callback is called, the JSON is already generated and echoed. Using the `ob` functions,
		 * this data can be retrieved, where it can be decoded back into PHP, modified, then encoded and re-echoed.
		 *
		 * Hey, at least I didn't have to copy and paste a huge chunk of code!
		 */
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
					case ElementType::Asset:
					{
						$json['elementType'] = 'asset';
						$json['assetSourceId'] = $element->sourceId;
						break;
					}
					case ElementType::Category:
					{
						$json['elementType'] = 'category';
						$json['categoryGroupId'] = $element->groupId;
						break;
					}
					case ElementType::Entry:
					{
						$json['elementType'] = 'entry';
						$json['sectionId'] = $element->sectionId;
						$json['entryTypeId'] = $element->typeId;
						break;
					}
					case ElementType::Tag:
					{
						$json['elementType'] = 'tag';
						$json['tagGroupId'] = $element->groupId;
						break;
					}
				}

				echo JsonHelper::encode($json);
			}
		});

		craft()->runController('elements/getEditorHtml');
	}
}

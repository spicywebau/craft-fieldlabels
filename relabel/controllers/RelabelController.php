<?php
namespace Craft;

class RelabelController extends BaseController
{
	public function actionGetEditorHtml()
	{
		craft()->runController('elements/getEditorHtml');
	}
}

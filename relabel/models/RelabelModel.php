<?php
namespace Craft;

/**
 * Relabel model class.
 */
class RelabelModel extends BaseComponentModel
{
	protected function defineAttributes()
	{
		return array_merge(parent::defineAttributes(), array(
			'fieldId'       => AttributeType::Number,
			'fieldLayoutId' => AttributeType::Number,
			'name'          => AttributeType::String,
			'instructions'  => AttributeType::String,
		));
	}
}

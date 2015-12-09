<?php
namespace Craft;

/**
 * Relabel model class.
 */
abstract class RelabelModel extends BaseComponentModel
{
	protected function defineAttributes()
	{
		return array_merge(parent::defineAttributes(), array(
			'field'        => AttributeType::Number,
			'fieldLayout'  => AttributeType::Number,
			'name'         => AttributeType::String,
			'instructions' => AttributeType::String,
		));
	}
}

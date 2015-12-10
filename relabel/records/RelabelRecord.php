<?php
namespace Craft;

/**
 * Relabel record class.
 */
class RelabelRecord extends BaseRecord
{
	public function getTableName()
	{
		return 'relabel';
	}

	public function defineRelations()
	{
		return array(
			'field'       => array(static::BELONGS_TO, 'FieldRecord',       'onDelete' => static::CASCADE),
			'fieldLayout' => array(static::BELONGS_TO, 'FieldLayoutRecord', 'onDelete' => static::CASCADE),
		);
	}

	protected function defineAttributes()
	{
		return array(
			'name'         => AttributeType::String,
			'instructions' => AttributeType::String,
		);
	}
}

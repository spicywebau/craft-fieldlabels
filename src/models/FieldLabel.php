<?php
namespace spicyweb\fieldlabels\models;

use Craft;
use craft\base\Model;

/**
 * Class FieldLabel
 *
 * @package spicyweb\fieldlabels\models
 * @author Spicy Web <craft@spicyweb.com.au>
 * @author Benjamin Fleming
 * @since 1.0.0
 */
class FieldLabel extends Model
{
	/**
	 * @var int|null The block type ID.
	 */
	public $id;

	/**
	 * @var int|null The field ID.
	 */
	public $fieldId;

	/**
	 * @var int|null The field layout ID.
	 */
	public $fieldLayoutId;

	/**
	 * @var string|null The label name.
	 */
	public $name;

	/**
	 * @var string|null The label instructions.
	 */
	public $instructions;

	/**
	 * @var string
	 */
	public $uid;

	/**
	 * @inheritdoc
	 */
	public function rules()
	{
		return [
			[['id', 'fieldId'], 'number', 'integerOnly' => true],
		];
	}

	/**
	 * Returns the label name as the string representation.
	 *
	 * @return string
	 */
	public function __toString(): string
	{
		return (string)$this->name;
	}
}

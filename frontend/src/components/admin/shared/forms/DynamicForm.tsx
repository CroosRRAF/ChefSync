import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarDays, Eye, EyeOff, Plus, X } from "lucide-react";
import React, { useCallback, useState } from "react";

export interface FieldOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface FormField {
  name: string;
  label: string;
  type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "textarea"
    | "select"
    | "checkbox"
    | "radio"
    | "switch"
    | "date"
    | "file"
    | "tags";
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  description?: string;
  options?: FieldOption[];
  multiple?: boolean;
  accept?: string; // for file inputs
  min?: number;
  max?: number;
  pattern?: string;
  validation?: (value: any) => string | null;
  defaultValue?: any;
  rows?: number; // for textarea
}

export interface FormError {
  field: string;
  message: string;
}

interface DynamicFormProps {
  fields: FormField[];
  title?: string;
  description?: string;
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  errors?: FormError[];
  layout?: "vertical" | "horizontal";
  columns?: 1 | 2 | 3;
  className?: string;
}

const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  title,
  description,
  initialValues = {},
  onSubmit,
  onCancel,
  submitText = "Submit",
  cancelText = "Cancel",
  loading = false,
  errors = [],
  layout = "vertical",
  columns = 1,
  className = "",
}) => {
  const [values, setValues] = useState<Record<string, any>>(() => {
    const defaultValues: Record<string, any> = {};
    fields.forEach((field) => {
      defaultValues[field.name] =
        initialValues[field.name] ?? field.defaultValue ?? "";
    });
    return defaultValues;
  });

  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>(
    {}
  );
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Update value for a field
  const updateValue = useCallback(
    (fieldName: string, value: any) => {
      setValues((prev) => ({ ...prev, [fieldName]: value }));

      // Clear validation error when user starts typing
      if (validationErrors[fieldName]) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
      }
    },
    [validationErrors]
  );

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      const value = values[field.name];

      // Required validation
      if (
        field.required &&
        (!value || (Array.isArray(value) && value.length === 0))
      ) {
        newErrors[field.name] = `${field.label} is required`;
        return;
      }

      // Custom validation
      if (field.validation && value) {
        const error = field.validation(value);
        if (error) {
          newErrors[field.name] = error;
          return;
        }
      }

      // Type-specific validation
      if (value) {
        switch (field.type) {
          case "email":
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              newErrors[field.name] = "Please enter a valid email address";
            }
            break;
          case "number":
            const num = Number(value);
            if (isNaN(num)) {
              newErrors[field.name] = "Please enter a valid number";
            } else {
              if (field.min !== undefined && num < field.min) {
                newErrors[field.name] = `Value must be at least ${field.min}`;
              }
              if (field.max !== undefined && num > field.max) {
                newErrors[
                  field.name
                ] = `Value must be no more than ${field.max}`;
              }
            }
            break;
          case "password":
            if (value.length < 6) {
              newErrors[field.name] = "Password must be at least 6 characters";
            }
            break;
        }
      }
    });

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fields, values]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await onSubmit(values);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  // Get field error message
  const getFieldError = (fieldName: string) => {
    const validationError = validationErrors[fieldName];
    const serverError = errors.find((e) => e.field === fieldName)?.message;
    return validationError || serverError || null;
  };

  // Render form field
  const renderField = (field: FormField) => {
    const value = values[field.name];
    const error = getFieldError(field.name);
    const fieldId = `field-${field.name}`;

    const commonProps = {
      id: fieldId,
      disabled: field.disabled || loading,
    };

    const fieldContent = () => {
      switch (field.type) {
        case "text":
        case "email":
        case "number":
          return (
            <Input
              {...commonProps}
              type={field.type}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => updateValue(field.name, e.target.value)}
              min={field.min}
              max={field.max}
              pattern={field.pattern}
              className={error ? "border-red-500" : ""}
            />
          );

        case "password":
          return (
            <div className="relative">
              <Input
                {...commonProps}
                type={showPasswords[field.name] ? "text" : "password"}
                placeholder={field.placeholder}
                value={value}
                onChange={(e) => updateValue(field.name, e.target.value)}
                className={error ? "border-red-500" : ""}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() =>
                  setShowPasswords((prev) => ({
                    ...prev,
                    [field.name]: !prev[field.name],
                  }))
                }
              >
                {showPasswords[field.name] ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </Button>
            </div>
          );

        case "textarea":
          return (
            <Textarea
              {...commonProps}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => updateValue(field.name, e.target.value)}
              rows={field.rows || 3}
              className={error ? "border-red-500" : ""}
            />
          );

        case "select":
          return (
            <Select
              disabled={commonProps.disabled}
              value={value}
              onValueChange={(newValue) => updateValue(field.name, newValue)}
            >
              <SelectTrigger className={error ? "border-red-500" : ""}>
                <SelectValue
                  placeholder={field.placeholder || `Select ${field.label}`}
                />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={String(option.value)}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );

        case "checkbox":
          if (field.options && field.multiple) {
            // Multiple checkboxes
            return (
              <div className="space-y-2">
                {field.options.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`${fieldId}-${option.value}`}
                      checked={
                        Array.isArray(value) && value.includes(option.value)
                      }
                      onCheckedChange={(checked) => {
                        const currentValues = Array.isArray(value) ? value : [];
                        if (checked) {
                          updateValue(field.name, [
                            ...currentValues,
                            option.value,
                          ]);
                        } else {
                          updateValue(
                            field.name,
                            currentValues.filter((v) => v !== option.value)
                          );
                        }
                      }}
                      disabled={option.disabled || commonProps.disabled}
                    />
                    <Label htmlFor={`${fieldId}-${option.value}`}>
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            );
          } else {
            // Single checkbox
            return (
              <div className="flex items-center space-x-2">
                <Checkbox
                  {...commonProps}
                  checked={value}
                  onCheckedChange={(checked) =>
                    updateValue(field.name, checked)
                  }
                />
                <Label htmlFor={fieldId}>{field.description}</Label>
              </div>
            );
          }

        case "radio":
          return (
            <RadioGroup
              value={value}
              onValueChange={(newValue) => updateValue(field.name, newValue)}
              disabled={commonProps.disabled}
            >
              {field.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={String(option.value)}
                    id={`${fieldId}-${option.value}`}
                    disabled={option.disabled}
                  />
                  <Label htmlFor={`${fieldId}-${option.value}`}>
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          );

        case "switch":
          return (
            <div className="flex items-center space-x-2">
              <Switch
                {...commonProps}
                checked={value}
                onCheckedChange={(checked) => updateValue(field.name, checked)}
              />
              <Label htmlFor={fieldId}>{field.description}</Label>
            </div>
          );

        case "date":
          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !value && "text-muted-foreground",
                    error && "border-red-500"
                  )}
                  disabled={commonProps.disabled}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {value
                    ? format(new Date(value), "PPP")
                    : field.placeholder || "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={value ? new Date(value) : undefined}
                  onSelect={(date) =>
                    updateValue(field.name, date?.toISOString().split("T")[0])
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          );

        case "file":
          return (
            <div className="space-y-2">
              <Input
                {...commonProps}
                type="file"
                accept={field.accept}
                multiple={field.multiple}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  updateValue(field.name, field.multiple ? files : files[0]);
                }}
                className={error ? "border-red-500" : ""}
              />
              {value && (
                <div className="text-sm text-gray-600">
                  {Array.isArray(value)
                    ? `${value.length} file(s) selected`
                    : value.name || "File selected"}
                </div>
              )}
            </div>
          );

        case "tags":
          const tags = Array.isArray(value) ? value : [];
          return (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: string, index: number) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <X
                      size={12}
                      className="cursor-pointer hover:text-red-500"
                      onClick={() => {
                        const newTags = tags.filter((_, i) => i !== index);
                        updateValue(field.name, newTags);
                      }}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={field.placeholder || "Add tag..."}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const input = e.target as HTMLInputElement;
                      const newTag = input.value.trim();
                      if (newTag && !tags.includes(newTag)) {
                        updateValue(field.name, [...tags, newTag]);
                        input.value = "";
                      }
                    }
                  }}
                  disabled={commonProps.disabled}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    const input = e.currentTarget
                      .previousElementSibling as HTMLInputElement;
                    const newTag = input.value.trim();
                    if (newTag && !tags.includes(newTag)) {
                      updateValue(field.name, [...tags, newTag]);
                      input.value = "";
                    }
                  }}
                  disabled={commonProps.disabled}
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>
          );

        default:
          return <div>Unsupported field type: {field.type}</div>;
      }
    };

    return (
      <div key={field.name} className="space-y-2">
        {field.type !== "checkbox" && field.type !== "switch" && (
          <Label htmlFor={fieldId} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}

        {fieldContent()}

        {field.description &&
          field.type !== "checkbox" &&
          field.type !== "switch" && (
            <p className="text-sm text-gray-600">{field.description}</p>
          )}

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  };

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <p className="text-gray-600">{description}</p>}
        </CardHeader>
      )}

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            className={cn(
              "grid gap-6",
              columns === 2 && "grid-cols-1 md:grid-cols-2",
              columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            )}
          >
            {fields.map(renderField)}
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                {cancelText}
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : submitText}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DynamicForm;

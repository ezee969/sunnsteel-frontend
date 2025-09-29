# Documentation Templates

This directory contains standardized templates for creating consistent documentation across the Sunsteel project.

## Available Templates

### [Component Template](./component-template.md)
Use this template when documenting React components. Includes sections for:
- Props documentation
- Usage examples
- Accessibility notes
- Styling information
- Related components

### [Hook Template](./hook-template.md)
Use this template when documenting custom React hooks. Includes sections for:
- Parameter and return value documentation
- Usage examples
- Error handling
- Performance considerations
- Testing examples

### [API Service Template](./api-service-template.md)
Use this template when documenting API services. Includes sections for:
- Method signatures
- Request/response types
- Error handling
- Caching strategies
- React Query integration

### [ADR Template](./adr-template.md)
Use this template when creating Architectural Decision Records. Includes sections for:
- Decision context and rationale
- Alternatives considered
- Implementation plan
- Success metrics
- Rollback plan

## How to Use Templates

1. **Copy the appropriate template** to your documentation location
2. **Rename the file** to match your component/hook/service name
3. **Fill in all sections** with relevant information
4. **Remove any sections** that don't apply to your specific case
5. **Update cross-references** to link to related documentation

## Template Guidelines

### Consistency
- Follow the exact structure provided in templates
- Use the same heading levels and formatting
- Maintain consistent terminology across all docs

### Completeness
- Fill in all applicable sections
- Provide real examples, not placeholder text
- Include error scenarios and edge cases

### Clarity
- Write for developers who are unfamiliar with the code
- Use clear, concise language
- Provide context for complex concepts

### Maintenance
- Update documentation when code changes
- Review and refresh examples regularly
- Keep cross-references up to date

## Example Usage

### Creating Component Documentation
```bash
# Copy the template
cp docs/templates/component-template.md docs/components/ui/Button.md

# Edit the file to document your Button component
# Update all sections with Button-specific information
```

### Creating Hook Documentation
```bash
# Copy the template
cp docs/templates/hook-template.md docs/hooks/useAuth.md

# Edit the file to document your useAuth hook
# Include all parameters, return values, and examples
```

## Quality Checklist

Before publishing documentation, ensure:

- [ ] All template sections are completed or removed if not applicable
- [ ] Code examples are tested and work correctly
- [ ] Cross-references link to existing documentation
- [ ] Accessibility information is included for UI components
- [ ] Error scenarios are documented
- [ ] Examples cover both basic and advanced usage

## Related Documentation

- [Documentation Standards](../.trae/rules/project_rules.md#documentation-standards)
- [Component Documentation](../components/README.md)
- [Hook Documentation](../hooks/README.md)
- [API Documentation](../api/README.md)
- [Architecture Documentation](../architecture/README.md)